const test = require('node:test');
const assert = require('node:assert');
const { letterToNumber } = require('../src/utils/examSolver');

test('examSolver: letterToNumber correctly maps valid letters', () => {
    assert.strictEqual(letterToNumber('A'), 1);
    assert.strictEqual(letterToNumber('B'), 2);
    assert.strictEqual(letterToNumber('C'), 3);
    assert.strictEqual(letterToNumber('D'), 4);
    assert.strictEqual(letterToNumber('E'), 5);
});

test('examSolver: letterToNumber handles lowercase, whitespace, and edge cases', () => {
    assert.strictEqual(letterToNumber('a'), 1);
    assert.strictEqual(letterToNumber('  c  '), 3);
    assert.strictEqual(letterToNumber('D) Option D'), 4);
    assert.strictEqual(letterToNumber(''), 0);
    assert.strictEqual(letterToNumber(null), 0);
    assert.strictEqual(letterToNumber(undefined), 0);
    assert.strictEqual(letterToNumber('Z'), 0);
    assert.strictEqual(letterToNumber('123'), 0);
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
    const textResponse = 'The correct choice is B because mitochondria is the powerhouse of the cell.';
    const letterMatch = textResponse.match(/\b([A-E])\b/i);

    assert.ok(letterMatch);
    assert.strictEqual(letterMatch[1].toUpperCase(), 'B');
    assert.strictEqual(letterToNumber(letterMatch[1]), 2);
});
