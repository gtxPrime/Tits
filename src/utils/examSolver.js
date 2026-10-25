const { GoogleGenAI } = require('@google/genai');
const { captureScreenRegion } = require('./screenCapture');
const { setTrayAnswer } = require('./tray');
const { triggerFullscreenPulse } = require('./screenPulse');
const storage = require('../storage');

const EXAM_SOLVER_PROMPT = `You are TITS (Test Intelligence & Tutoring System), an elite AI exam solver and academic tutor.
You have been provided with an image containing an exam question (centered around the cursor).

Analyze the question carefully and determine:
1. Is it a Multiple Choice Question (MCQ) or a Short Answer / Numerical / Coding question?
2. If MCQ:
   - Identify all options (e.g. A through Z).
   - Find the SINGLE correct answer.
   - Extract the correct option letter ('A' through 'Z').
3. If Short Answer / Coding:
   - Provide the concise, exact answer or code snippet.
   - Set letter to null.
4. Give a crisp 1-2 sentence explanation proving why the answer is correct.

CRITICAL: Return ONLY valid JSON with this exact schema (no markdown fences, no extra text):
{
  "type": "mcq",
  "letter": "A",
  "question": "Summary of question",
  "answer": "Exact option text or short answer",
  "explanation": "Crisp 1-2 sentence justification",
  "confidence": 98
}`;

function letterToNumber(letter) {
    if (!letter) return 0;
    const char = letter.toString().trim().toUpperCase()[0];
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
        return code - 64; // A=1, B=2, ... Z=26
    }
    const num = parseInt(char, 10);
    if (!isNaN(num) && num >= 1 && num <= 9) {
        return num;
    }
    return 0;
}

let isSolving = false;

/**
 * Execute question capture and AI solution
 * @param {Electron.BrowserWindow} mainWindow
 * @param {Object} [overrideOptions]
 */
async function solveCurrentExamQuestion(mainWindow, overrideOptions = {}) {
    if (isSolving) {
        console.log('[ExamSolver] Solve already in progress; ignoring trigger');
        return { success: false, error: 'Already solving' };
    }

    isSolving = true;
    try {
        const prefs = storage.getPreferences() || {};
        const config = storage.getConfig() || {};

        const captureMode = overrideOptions.mode || prefs.examCaptureRegion || 'cursor_crop';
        const cropW = prefs.cursorCropWidth || 850;
        const cropH = prefs.cursorCropHeight || 600;

        const enableTray = prefs.enableTrayOutput !== false;
        const enablePulse = prefs.enableScreenPulse !== false;
        const enableAudio = prefs.enableAudioBeeps !== false;

        console.log('[ExamSolver] Starting capture in mode:', captureMode);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('exam-solving-status', { status: 'capturing', message: 'Capturing question...' });
        }

        // 1. Capture screen region
        const capture = await captureScreenRegion({
            mode: captureMode,
            cropWidth: cropW,
            cropHeight: cropH,
        });

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('exam-solving-status', { status: 'analyzing', message: 'Analyzing with AI...' });
        }

        // 2. BYOK Key selection
        const apiKey = storage.getApiKey();
        const groqApiKey = storage.getGroqApiKey();

        if (!apiKey && !groqApiKey) {
            throw new Error('No API Key found. Please add your Gemini or Groq API key in Settings (BYOK).');
        }

        let rawResponseText = '';

        if (apiKey) {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const primaryModel = prefs.examVisionModel || 'gemini-2.5-flash';
            const modelsToTry = [primaryModel, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-3.8-flash'];
            const tried = new Set();
            let result = null;
            let lastError = '';

            for (const m of modelsToTry) {
                if (tried.has(m)) continue;
                tried.add(m);
                try {
                    console.log(`[ExamSolver] Calling Gemini model: ${m}`);
                    result = await ai.models.generateContent({
                        model: m,
                        contents: [
                            {
                                inlineData: {
                                    mimeType: 'image/jpeg',
                                    data: capture.base64Data,
                                },
                            },
                            { text: EXAM_SOLVER_PROMPT },
                        ],
                    });
                    if (result && result.text) break;
                } catch (err) {
                    console.warn(`[ExamSolver] Model ${m} failed:`, err.message);
                    lastError = err.message || '';
                }
            }

            if (!result || !result.text) {
                let userFriendlyErr = 'All Gemini vision models failed. Check your API key or network.';
                if (lastError && (lastError.includes('reported as leaked') || lastError.includes('PERMISSION_DENIED'))) {
                    userFriendlyErr =
                        'Google rejected this API key (reported as leaked). Please generate a fresh API key at aistudio.google.com and save it in Settings (BYOK).';
                } else if (lastError && lastError.includes('API key not valid')) {
                    userFriendlyErr = 'Invalid Gemini API key. Please verify your key at aistudio.google.com and paste it in Settings (BYOK).';
                } else if (lastError) {
                    userFriendlyErr = `Gemini API Error: ${lastError.slice(0, 150)}`;
                }
                throw new Error(userFriendlyErr);
            }

            rawResponseText = result.text || '';
        } else if (groqApiKey) {
            // Groq Vision fallback
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.2-11b-vision-preview',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: EXAM_SOLVER_PROMPT },
                                {
                                    type: 'image_url',
                                    image_url: { url: `data:image/jpeg;base64,${capture.base64Data}` },
                                },
                            ],
                        },
                    ],
                    temperature: 0.1,
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error('Groq error: ' + data.error.message);
            }
            rawResponseText = data.choices?.[0]?.message?.content || '';
        }

        console.log('[ExamSolver] Raw AI response:', rawResponseText);

        // 3. Parse JSON structure
        let parsed = null;
        try {
            // Clean markdown codeblocks if model included them
            const cleaned = rawResponseText
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.warn('[ExamSolver] JSON parse failed, attempting regex extraction');
            const letterMatch = rawResponseText.match(/\b([A-Z])\b/i);
            parsed = {
                type: letterMatch ? 'mcq' : 'short',
                letter: letterMatch ? letterMatch[1].toUpperCase() : null,
                question: 'Exam Question',
                answer: rawResponseText.slice(0, 300),
                explanation: rawResponseText,
                confidence: 90,
            };
        }

        // Format result object
        const finalResult = {
            success: true,
            type: parsed.type || (parsed.letter ? 'mcq' : 'short'),
            letter: parsed.letter ? parsed.letter.toUpperCase() : null,
            question: parsed.question || '',
            answer: parsed.answer || '',
            explanation: parsed.explanation || '',
            confidence: parsed.confidence || 95,
            timestamp: Date.now(),
        };

        const pulseCount = letterToNumber(finalResult.letter);

        // 4. Output Channels Routing
        // Channel 1: System Tray
        if (enableTray && finalResult.letter) {
            setTrayAnswer(finalResult.letter, finalResult.answer);
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
            // Channel 2: Stealth HUD Overlay Window
            mainWindow.webContents.send('exam-result', finalResult);

            // Channel 3: Screen Flash Pulse (if MCQ option letter found)
            if (enablePulse && pulseCount > 0) {
                triggerFullscreenPulse(pulseCount, prefs.screenPulseColor || '#facc15');
                mainWindow.webContents.send('pulse-screen', { count: pulseCount });
            }

            // Channel 4: Earbud Audio Beeps
            if (enableAudio && pulseCount > 0) {
                mainWindow.webContents.send('play-beeps', { count: pulseCount });
            }

            mainWindow.webContents.send('exam-solving-status', { status: 'idle', message: 'Done' });
        }

        return finalResult;
    } catch (err) {
        console.error('[ExamSolver] Error solving exam question:', err);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('exam-solving-status', { status: 'error', message: err.message });
        }
        return { success: false, error: err.message };
    } finally {
        isSolving = false;
    }
}

module.exports = {
    solveCurrentExamQuestion,
    letterToNumber,
};
