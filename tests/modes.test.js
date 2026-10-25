const test = require('node:test');
const assert = require('node:assert');
const storage = require('../src/storage');

test('modes: supports test mode and interview mode profiles and configurations', () => {
    const prefs = storage.getPreferences();

    // Verify test mode preferences exist
    assert.strictEqual(typeof prefs.examTriggerMode, 'string');
    assert.strictEqual(typeof prefs.examCaptureRegion, 'string');
    assert.strictEqual(typeof prefs.enableTrayOutput, 'boolean');
    assert.strictEqual(typeof prefs.enableHudOutput, 'boolean');

    // Verify interview mode preferences exist
    assert.strictEqual(typeof prefs.selectedProfile, 'string');
    assert.strictEqual(typeof prefs.audioMode, 'string');
    assert.strictEqual(typeof prefs.selectedLanguage, 'string');
    assert.strictEqual(typeof prefs.selectedScreenshotInterval, 'string');
});

test('modes: mode switching persists across storage calls', () => {
    storage.updatePreference('appMode', 'test');
    assert.strictEqual(storage.getPreferences().appMode, 'test');

    storage.updatePreference('appMode', 'interview');
    assert.strictEqual(storage.getPreferences().appMode, 'interview');
});
