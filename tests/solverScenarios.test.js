const test = require('node:test');
const assert = require('node:assert');

// Simulate the JSON parser and sanitizer from examSolver.js
function parseSolverOutput(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return {
            type: 'short',
            letter: null,
            question: '',
            answer: '',
            explanation: '',
            confidence: 0,
        };
    }

    try {
        // Strip markdown code fences
        const cleaned = rawText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        // Extract first JSON object if surrounded by chat text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        const toParse = jsonMatch ? jsonMatch[0] : cleaned;

        const parsed = JSON.parse(toParse);
        return {
            type: parsed.type || (parsed.letter ? 'mcq' : 'short'),
            letter: parsed.letter ? parsed.letter.toString().trim().toUpperCase()[0] : null,
            question: parsed.question || '',
            answer: parsed.answer || '',
            explanation: parsed.explanation || '',
            confidence: Math.max(0, Math.min(Number(parsed.confidence) || 90, 100)),
        };
    } catch (e) {
        // Fallback regex extraction
        const letterMatch = rawText.match(/\b([A-E])\b/i);
        return {
            type: letterMatch ? 'mcq' : 'short',
            letter: letterMatch ? letterMatch[1].toUpperCase() : null,
            question: 'Exam Question',
            answer: rawText.slice(0, 300),
            explanation: rawText,
            confidence: 85,
        };
    }
}

test('solverScenarios: parses math calculus question with LaTeX formatting', () => {
    const raw = `{
        "type": "mcq",
        "letter": "B",
        "question": "What is the derivative of f(x) = e^(2x)?",
        "answer": "2e^(2x)",
        "explanation": "By chain rule, d/dx[e^(2x)] = e^(2x) * d/dx[2x] = 2e^(2x).",
        "confidence": 99
    }`;

    const res = parseSolverOutput(raw);
    assert.strictEqual(res.type, 'mcq');
    assert.strictEqual(res.letter, 'B');
    assert.strictEqual(res.answer, '2e^(2x)');
    assert.strictEqual(res.confidence, 99);
});

test('solverScenarios: parses programming question with embedded code block', () => {
    const raw = `\`\`\`json
    {
        "type": "mcq",
        "letter": "D",
        "question": "What is the output of [1, 2] + [3, 4] in Python?",
        "answer": "[1, 2, 3, 4]",
        "explanation": "In Python, the + operator concatenates lists.",
        "confidence": 100
    }
    \`\`\``;

    const res = parseSolverOutput(raw);
    assert.strictEqual(res.letter, 'D');
    assert.strictEqual(res.answer, '[1, 2, 3, 4]');
    assert.strictEqual(res.confidence, 100);
});

test('solverScenarios: handles conversational intro and outro around JSON', () => {
    const raw = `Sure! Here is the solved question:
    {
        "type": "mcq",
        "letter": "A",
        "question": "Which sorting algorithm has worst case O(n log n)?",
        "answer": "Merge Sort",
        "explanation": "Merge sort consistently runs in O(n log n) in all cases.",
        "confidence": 98
    }
    I hope this helps you ace the exam!`;

    const res = parseSolverOutput(raw);
    assert.strictEqual(res.letter, 'A');
    assert.strictEqual(res.answer, 'Merge Sort');
});

test('solverScenarios: handles numerical short-answer questions without option letters', () => {
    const raw = `{
        "type": "short",
        "letter": null,
        "question": "Calculate the determinant of [[1, 2], [3, 4]]",
        "answer": "-2",
        "explanation": "(1*4) - (2*3) = 4 - 6 = -2",
        "confidence": 97
    }`;

    const res = parseSolverOutput(raw);
    assert.strictEqual(res.type, 'short');
    assert.strictEqual(res.letter, null);
    assert.strictEqual(res.answer, '-2');
});

test('solverScenarios: clamps confidence within 0 to 100 range', () => {
    const rawOver = `{"type":"mcq","letter":"C","answer":"Test","confidence":150}`;
    assert.strictEqual(parseSolverOutput(rawOver).confidence, 100);

    const rawUnder = `{"type":"mcq","letter":"C","answer":"Test","confidence":-20}`;
    assert.strictEqual(parseSolverOutput(rawUnder).confidence, 0);
});

test('solverScenarios: handles completely unformatted text response via regex fallback', () => {
    const rawText = 'Based on the prompt, the correct answer to the question is B because osmosis requires a semi-permeable membrane.';
    const res = parseSolverOutput(rawText);

    assert.strictEqual(res.type, 'mcq');
    assert.strictEqual(res.letter, 'B');
    assert.ok(res.answer.includes('Based on the prompt'));
});

test('solverScenarios: handles null, undefined, or empty responses safely without crashing', () => {
    const emptyRes = parseSolverOutput('');
    assert.strictEqual(emptyRes.letter, null);
    assert.strictEqual(emptyRes.confidence, 0);

    const nullRes = parseSolverOutput(null);
    assert.strictEqual(nullRes.letter, null);
});
