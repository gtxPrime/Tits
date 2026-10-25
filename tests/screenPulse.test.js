const test = require('node:test');
const assert = require('node:assert');
const storage = require('../src/storage');
const { initPulseWindow, triggerFullscreenPulse, destroyPulseWindow } = require('../src/utils/screenPulse');
const { letterToNumber } = require('../src/utils/examSolver');

test('screenPulse: module exports core lifecycle and trigger functions', () => {
    assert.strictEqual(typeof initPulseWindow, 'function');
    assert.strictEqual(typeof triggerFullscreenPulse, 'function');
    assert.strictEqual(typeof destroyPulseWindow, 'function');
});

test('screenPulse: default preferences have enableScreenPulse set to true', () => {
    const prefs = storage.DEFAULT_PREFERENCES;
    assert.strictEqual(prefs.enableScreenPulse, true, 'Screen pulse should be enabled by default');
    assert.ok(typeof prefs.screenPulseColor === 'string', 'Screen pulse color must be configured');
    assert.ok(prefs.screenPulseDuration > 0, 'Screen pulse duration must be greater than zero');
});

test('screenPulse: letterToNumber pulse counts map accurately for options A through D', () => {
    assert.strictEqual(letterToNumber('A'), 1, 'Option A = 1 pulse');
    assert.strictEqual(letterToNumber('B'), 2, 'Option B = 2 pulses');
    assert.strictEqual(letterToNumber('C'), 3, 'Option C = 3 pulses');
    assert.strictEqual(letterToNumber('D'), 4, 'Option D = 4 pulses');
    assert.strictEqual(letterToNumber(null), 0, 'Null returns 0 pulses');
});
