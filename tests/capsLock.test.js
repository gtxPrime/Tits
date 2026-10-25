const test = require('node:test');
const assert = require('node:assert');
const { letterToCount, triggerCapsLockAnswer, pulseCapsLock, toggleCapsLock } = require('../src/utils/capsLock');
const storage = require('../src/storage');

test('capsLock: letterToCount maps options A through Z accurately', () => {
    assert.strictEqual(letterToCount('A'), 1);
    assert.strictEqual(letterToCount('B'), 2);
    assert.strictEqual(letterToCount('C'), 3);
    assert.strictEqual(letterToCount('D'), 4);
    assert.strictEqual(letterToCount('E'), 5);
    assert.strictEqual(letterToCount('Z'), 26);
});

test('capsLock: letterToCount handles lowercase, digits, and whitespace', () => {
    assert.strictEqual(letterToCount('  a  '), 1);
    assert.strictEqual(letterToCount('b'), 2);
    assert.strictEqual(letterToCount('3'), 3);
    assert.strictEqual(letterToCount('9'), 9);
});

test('capsLock: letterToCount safely handles edge cases', () => {
    assert.strictEqual(letterToCount(''), 0);
    assert.strictEqual(letterToCount(null), 0);
    assert.strictEqual(letterToCount(undefined), 0);
    assert.strictEqual(letterToCount('!'), 1);
});

test('capsLock: pulseCapsLock and toggleCapsLock execute without throwing', () => {
    assert.doesNotThrow(() => {
        pulseCapsLock(1, 100);
    });
    assert.doesNotThrow(() => {
        toggleCapsLock();
    });
});

test('capsLock: triggerCapsLockAnswer handles both pulse and toggle modes safely', () => {
    assert.doesNotThrow(() => {
        triggerCapsLockAnswer('B', 'pulse');
    });
    assert.doesNotThrow(() => {
        triggerCapsLockAnswer('C', 'toggle');
    });
    assert.doesNotThrow(() => {
        triggerCapsLockAnswer(null, 'pulse');
    });
});

test('capsLock: preferences schema includes capsLock default values', () => {
    const prefs = storage.getPreferences();
    assert.strictEqual(typeof prefs.enableCapsLockIndicator, 'boolean');
    assert.ok(prefs.capsLockMode === 'pulse' || prefs.capsLockMode === 'toggle');
});
