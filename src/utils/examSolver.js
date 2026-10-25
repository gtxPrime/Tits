const { GoogleGenAI } = require('@google/genai');
const { captureScreenRegion } = require('./screenCapture');
const { setTrayAnswer } = require('./tray');
const { triggerFullscreenPulse } = require('./screenPulse');
const { triggerCapsLockAnswer } = require('./capsLock');
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

function extractOptionLetter(text) {
    if (!text) return null;
    const keywordMatch = text.match(/\b(?:option|answer|choice|letter)(?:\s+(?:is|should\s+be))?\s*[:=\-]?\s*[\(\[]?\s*\b([A-Za-z])\b/i);
    if (keywordMatch) return keywordMatch[1].toUpperCase();
    const bracketMatch = text.match(/[\(\[]\s*([A-Za-z])\s*[\)\]]/);
    if (bracketMatch) return bracketMatch[1].toUpperCase();
    const singleLetterMatch = text.match(/(?:\s|^)([A-Z])(?:\.|\s|$|,)/);
    if (singleLetterMatch) return singleLetterMatch[1].toUpperCase();
    return null;
}

let isSolving = false;
let solveStartTime = 0;
let solveWatchdog = null;

function resetSolveState() {
    if (solveWatchdog) {
        clearTimeout(solveWatchdog);
        solveWatchdog = null;
    }
    isSolving = false;
    solveStartTime = 0;
    console.log('[ExamSolver] Solve state manually reset');
}

async function callWithTimeout(promise, ms, errMessage) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(errMessage || `Operation timed out after ${ms}ms`)), ms);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Execute question capture and AI solution
 * @param {Electron.BrowserWindow} mainWindow
 * @param {Object} [overrideOptions]
 */
async function solveCurrentExamQuestion(mainWindow, overrideOptions = {}) {
    if (isSolving) {
        // Auto-break stale lock if running for more than 15 seconds
        if (Date.now() - solveStartTime > 15000) {
            console.warn('[ExamSolver] Previous solve lock exceeded 15s; force-resetting lock');
            resetSolveState();
        } else {
            console.log('[ExamSolver] Solve already in progress; ignoring trigger');
            return { success: false, error: 'Already solving' };
        }
    }

    isSolving = true;
    solveStartTime = Date.now();

    // 20-second ultimate safety watchdog to ensure isSolving is NEVER stuck
    solveWatchdog = setTimeout(() => {
        if (isSolving) {
            console.error('[ExamSolver] Safety watchdog: solve operation exceeded 20s. Force-clearing isSolving.');
            isSolving = false;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('exam-solving-status', {
                    status: 'error',
                    message: 'Solving timed out after 20s. Please verify your API key or network and try again.',
                });
            }
        }
    }, 20000);

    try {
        const prefs = storage.getPreferences() || {};
        const config = storage.getConfig() || {};

        const captureMode = overrideOptions.mode || prefs.examCaptureRegion || 'cursor_crop';
        const cropW = prefs.cursorCropWidth || 850;
        const cropH = prefs.cursorCropHeight || 600;

        const enableTray = prefs.enableTrayOutput !== false;
        const enablePulse = prefs.enableScreenPulse !== false;
        const enableAudio = prefs.enableAudioBeeps !== false;
        const enableCapsLock = prefs.enableCapsLockIndicator === true;
        const capsLockMode = prefs.capsLockMode || 'pulse';

        console.log('[ExamSolver] Starting capture in mode:', captureMode);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('exam-solving-status', { status: 'capturing', message: 'Capturing question...' });
        }

        // 1. Capture screen region with timeout protection
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
        let lastError = '';

        // Attempt Gemini first if configured
        if (apiKey) {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const primaryModel = prefs.examVisionModel || 'gemini-flash-latest';
            const modelsToTry = [primaryModel, 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash'].filter(
                Boolean
            );
            const tried = new Set();
            let result = null;

            for (const m of modelsToTry) {
                if (tried.has(m)) continue;
                tried.add(m);
                try {
                    console.log(`[ExamSolver] Calling Gemini model: ${m}`);
                    const modelPromise = ai.models.generateContent({
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
                    result = await callWithTimeout(modelPromise, 7000, `Model ${m} timed out after 7s`);
                    if (result && result.text) break;
                } catch (err) {
                    console.warn(`[ExamSolver] Model ${m} failed:`, err.message);
                    lastError = err.message || '';
                }
            }

            if (result && result.text) {
                rawResponseText = result.text;
            }
        }

        // Automatic fallback to Groq Vision if Gemini failed or was not configured
        if (!rawResponseText && groqApiKey) {
            console.log('[ExamSolver] Attempting Groq vision fallback...');
            try {
                const groqFetchPromise = fetch('https://api.groq.com/openai/v1/chat/completions', {
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

                const response = await callWithTimeout(groqFetchPromise, 7000, 'Groq request timed out after 7s');
                const data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    rawResponseText = data.choices[0].message.content;
                } else if (data.error) {
                    lastError = data.error.message;
                }
            } catch (err) {
                console.warn('[ExamSolver] Groq fallback failed:', err.message);
                if (!lastError) lastError = err.message;
            }
        }

        if (!rawResponseText) {
            let userFriendlyErr = 'All vision models failed. Check your API key or network connection.';
            if (lastError && (lastError.includes('RESOURCE_EXHAUSTED') || lastError.includes('429'))) {
                userFriendlyErr =
                    'Gemini Free Tier quota exceeded (429). Please wait or generate a new free key at aistudio.google.com, or configure Groq in Settings.';
            } else if (lastError && (lastError.includes('reported as leaked') || lastError.includes('PERMISSION_DENIED'))) {
                userFriendlyErr =
                    'Google rejected this API key (reported as leaked). Please generate a fresh API key at aistudio.google.com and save it in Settings (BYOK).';
            } else if (lastError && (lastError.includes('API key not valid') || lastError.includes('API_KEY_INVALID'))) {
                userFriendlyErr = 'Invalid Gemini API key. Please verify your key at aistudio.google.com and paste it in Settings (BYOK).';
            } else if (lastError) {
                userFriendlyErr = `Vision API Error: ${lastError.slice(0, 150)}`;
            }
            throw new Error(userFriendlyErr);
        }

        console.log('[ExamSolver] Raw AI response:', rawResponseText);

        // 3. Robust JSON structure parsing
        let parsed = null;
        try {
            const cleaned = rawResponseText
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
        } catch (e) {
            console.warn('[ExamSolver] JSON parse failed, attempting regex extraction');
            const letter = extractOptionLetter(rawResponseText);
            parsed = {
                type: letter ? 'mcq' : 'short',
                letter: letter,
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

        // Channel 3: Fullscreen Screen Edge Pulse (Ray)
        if (enablePulse && pulseCount > 0) {
            triggerFullscreenPulse(pulseCount, prefs.screenPulseColor || '#facc15');
        }

        // Channel 5: Keyboard Caps Lock LED Indicator
        if (enableCapsLock && finalResult.letter) {
            triggerCapsLockAnswer(finalResult.letter, capsLockMode);
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
            // Channel 2: Stealth HUD Overlay Window
            mainWindow.webContents.send('exam-result', finalResult);

            if (enablePulse && pulseCount > 0 && mainWindow.isVisible()) {
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
        if (solveWatchdog) {
            clearTimeout(solveWatchdog);
            solveWatchdog = null;
        }
        isSolving = false;
    }
}

module.exports = {
    solveCurrentExamQuestion,
    letterToNumber,
    resetSolveState,
    extractOptionLetter,
    isCurrentlySolving: () => isSolving,
};
