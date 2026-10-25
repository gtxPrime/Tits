const test = require('node:test');
const assert = require('node:assert');
const { GoogleGenAI } = require('@google/genai');

const DEMO_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA0_0l1exigeuJY6Z2hggNH8xLkSfbwUQk';

test('liveApi: successfully connects to Gemini 2.5 Flash and responds', async t => {
    try {
        const ai = new GoogleGenAI({ apiKey: DEMO_KEY });
        const startTime = Date.now();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Answer with only the single letter: What is 5 + 5? A) 8 B) 10 C) 12 D) 15',
        });

        const elapsed = Date.now() - startTime;
        console.log(`[Test] Live Gemini response received in ${elapsed}ms: ${response.text?.trim()}`);

        assert.ok(response.text);
        assert.ok(response.text.includes('B'));
        assert.ok(elapsed < 15000, 'Live API latency should be under 15 seconds');
    } catch (err) {
        if (err.message?.includes('leaked') || err.message?.includes('API key') || err.status === 403) {
            t.skip('Skipping live Gemini test: API key revoked by Google scanner as leaked. Provide a valid GEMINI_API_KEY in environment to test.');
            return;
        }
        throw err;
    }
});

test('liveApi: returns structured JSON schema for MCQ questions', async t => {
    try {
        const ai = new GoogleGenAI({ apiKey: DEMO_KEY });

        const prompt = `You are an exam solver. Return ONLY a JSON object:
        { "type": "mcq", "letter": "A", "answer": "Paris", "explanation": "Capital of France", "confidence": 99 }
        Question: What is the capital of France? A) Paris B) London C) Madrid D) Rome`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        assert.ok(response.text);
        const cleaned = response.text
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        const parsed = JSON.parse(cleaned);
        assert.strictEqual(parsed.letter, 'A');
        assert.ok(parsed.answer.toLowerCase().includes('paris'));
        assert.ok(typeof parsed.confidence === 'number');
    } catch (err) {
        if (err.message?.includes('leaked') || err.message?.includes('API key') || err.status === 403) {
            t.skip('Skipping live Gemini test: API key revoked by Google scanner as leaked. Provide a valid GEMINI_API_KEY in environment to test.');
            return;
        }
        throw err;
    }
});

test('liveApi: invalid API key throws clear rejection', async () => {
    const fakeAi = new GoogleGenAI({ apiKey: 'AIzaSyFakeKey_NotReal_123456789' });

    let threw = false;
    try {
        await fakeAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello',
        });
    } catch (err) {
        threw = true;
        assert.ok(err.message.includes('API_KEY_INVALID') || err.message.includes('400') || err.message.includes('API key'));
    }

    assert.strictEqual(threw, true, 'Invalid key should throw an API error');
});
