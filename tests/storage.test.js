const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const storage = require('../src/storage');

test('storage: getConfigDir supports tits-config and handles platform paths', () => {
    const dir = storage.getConfigDir();
    assert.ok(dir);
    assert.ok(typeof dir === 'string');
    assert.ok(dir.includes('tits-config'));
});

test('storage: getConfig returns valid default structure', () => {
    const config = storage.getConfig();
    assert.ok(config);
    assert.strictEqual(typeof config.configVersion, 'number');
    assert.ok(config.layout);
});

test('storage: getPreferences includes both Test Mode and Interview Mode settings', () => {
    const prefs = storage.getPreferences();
    assert.ok(prefs);
    assert.ok(prefs.examTriggerMode, 'Should have examTriggerMode');
    assert.ok(prefs.examCaptureRegion, 'Should have examCaptureRegion');
    assert.strictEqual(typeof prefs.cursorCropWidth, 'number');
    assert.strictEqual(typeof prefs.cursorCropHeight, 'number');
    assert.strictEqual(typeof prefs.enableTrayOutput, 'boolean');
    assert.strictEqual(typeof prefs.enableHudOutput, 'boolean');
    assert.strictEqual(typeof prefs.enableScreenPulse, 'boolean');
    assert.strictEqual(typeof prefs.enableAudioBeeps, 'boolean');
    assert.ok(prefs.selectedProfile, 'Should have selectedProfile for interview mode');
    assert.ok(prefs.audioMode, 'Should have audioMode');
});

test('storage: updatePreference updates and persists key correctly', () => {
    const testKey = 'testPreferenceField_' + Date.now();
    const testVal = 'value_123';
    storage.updatePreference(testKey, testVal);

    const updated = storage.getPreferences();
    assert.strictEqual(updated[testKey], testVal);
});

test('storage: credentials get and set correctly', () => {
    const initial = storage.getCredentials();
    assert.ok(initial);
    assert.strictEqual(typeof initial, 'object');

    storage.setApiKey('test_gemini_api_key_xyz');
    assert.strictEqual(storage.getApiKey(), 'test_gemini_api_key_xyz');

    storage.setGroqApiKey('test_groq_api_key_abc');
    assert.strictEqual(storage.getGroqApiKey(), 'test_groq_api_key_abc');
});
