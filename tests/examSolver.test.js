const test = require('node:test');
const assert = require('node:assert');
const { letterToNumber } = require('../src/utils/examSolver');

test('examSolver: letterToNumber correctly maps valid letters', () => {
    assert.strictEqual(letterToNumber('A'), 1);
    assert.strictEqual(letterToNumber('B'), 2);
    assert.strictEqual(letterToNumber('C'), 3);
    assert.strictEqual(letterToNumber('D'), 4);
    assert.strictEqual(letterToNumber('E'), 5);
    assert.strictEqual(letterToNumber('F'), 6);
    assert.strictEqual(letterToNumber('Z'), 26);
});

test('examSolver: letterToNumber handles lowercase, whitespace, and edge cases', () => {
    assert.strictEqual(letterToNumber('a'), 1);
    assert.strictEqual(letterToNumber('  c  '), 3);
    assert.strictEqual(letterToNumber('D) Option D'), 4);
    assert.strictEqual(letterToNumber('z'), 26);
    assert.strictEqual(letterToNumber(''), 0);
    assert.strictEqual(letterToNumber(null), 0);
    assert.strictEqual(letterToNumber(undefined), 0);
    assert.strictEqual(letterToNumber('!'), 0);
});

test('examSolver: JSON schema parsing and extraction simulation', () => {
    const rawJson = '{"type":"mcq","letter":"B","question":"What is 2+2?","answer":"4","explanation":"Basic arithmetic","confidence":99}';
    const parsed = JSON.parse(rawJson);

    assert.strictEqual(parsed.type, 'mcq');
    assert.strictEqual(parsed.letter, 'B');
    assert.strictEqual(parsed.answer, '4');
    assert.strictEqual(parsed.confidence, 99);
});

test('examSolver: markdown codeblock cleaning handles markdown formatted responses', () => {
    const markdownResponse =
        '```json\n{\n  "type": "mcq",\n  "letter": "C",\n  "answer": "O(log n)",\n  "explanation": "Binary search divides the search space in half each step."\n}\n```';
    const cleaned = markdownResponse
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
    const parsed = JSON.parse(cleaned);

    assert.strictEqual(parsed.type, 'mcq');
    assert.strictEqual(parsed.letter, 'C');
    assert.strictEqual(parsed.answer, 'O(log n)');
});

test('examSolver: regex fallback handles unformatted text responses', () => {
    const textResponse = 'The correct choice is H because mitochondria is the powerhouse of the cell.';
    const letterMatch = textResponse.match(/\b([A-Z])\b/i);

    assert.ok(letterMatch);
    assert.strictEqual(letterMatch[1].toUpperCase(), 'H');
    assert.strictEqual(letterToNumber(letterMatch[1]), 8);
});

test('examSolver: resetSolveState resets lock and isCurrentlySolving returns false', () => {
    const { resetSolveState, isCurrentlySolving } = require('../src/utils/examSolver');
    assert.strictEqual(typeof resetSolveState, 'function');
    assert.strictEqual(typeof isCurrentlySolving, 'function');

    resetSolveState();
    assert.strictEqual(isCurrentlySolving(), false, 'isCurrentlySolving must be false after reset');
});

test('examSolver: extractOptionLetter handles complex conversational answer formats', () => {
    const { extractOptionLetter } = require('../src/utils/examSolver');
    const cases = [
        { text: 'Based on analysis, the correct answer is: [B]', expected: 'B' },
        { text: 'Option D is mathematically valid because det(A) != 0.', expected: 'D' },
        { text: 'Correct choice: A.', expected: 'A' },
        { text: 'Answer = C', expected: 'C' },
        { text: 'The correct choice is H because mitochondria is the powerhouse.', expected: 'H' },
    ];

    for (const c of cases) {
        const letter = extractOptionLetter(c.text);
        assert.strictEqual(letter, c.expected, `Failed extracting from: "${c.text}"`);
    }

    assert.strictEqual(extractOptionLetter('No options provided, answer is 42'), null);
});
