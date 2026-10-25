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

test('storage: getModelUsage calculates remaining quota and usage accurately', () => {
    const initialUsage = storage.getModelUsage('gemini-flash-latest');
    assert.ok(initialUsage);
    assert.strictEqual(initialUsage.dailyLimit, 250);
    assert.ok(typeof initialUsage.usedToday === 'number');
    assert.strictEqual(initialUsage.remaining, Math.max(0, 250 - initialUsage.usedToday));
    assert.strictEqual(initialUsage.percentUsed + initialUsage.percentRemaining, 100);

    const prevUsed = initialUsage.usedToday;
    storage.incrementLimitCount('gemini-flash-latest');
    const updatedUsage = storage.getModelUsage('gemini-flash-latest');
    assert.strictEqual(updatedUsage.usedToday, prevUsed + 1);
    assert.strictEqual(updatedUsage.remaining, Math.max(0, 250 - (prevUsed + 1)));
});

test('storage: getAllModelUsages returns all supported live models with speed and intelligence ratings', () => {
    const allUsages = storage.getAllModelUsages();
    assert.ok(allUsages);
    const expectedModels = [
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-3.1-pro-preview',
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-preview',
    ];

    for (const modelId of expectedModels) {
        assert.ok(allUsages[modelId], `Model ${modelId} must exist in all usages`);
        assert.ok(allUsages[modelId].meta.speedRating >= 1 && allUsages[modelId].meta.speedRating <= 5);
        assert.ok(allUsages[modelId].meta.reasoningRating >= 1 && allUsages[modelId].meta.reasoningRating <= 5);
        assert.ok(allUsages[modelId].dailyLimit > 0);
        assert.strictEqual(allUsages[modelId].remaining, Math.max(0, allUsages[modelId].dailyLimit - allUsages[modelId].usedToday));
    }
});
