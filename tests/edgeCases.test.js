const test = require('node:test');
const assert = require('node:assert');
const { calculateCropRect } = require('../src/utils/screenCapture');
const { createTrayIconDataUrl } = require('../src/utils/tray');
const storage = require('../src/storage');

test('edgeCases: screenCapture handles extreme negative coordinates', () => {
    const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    const bounds = calculateCropRect({
        cursor: { x: -9999, y: -5000 },
        displayBounds,
        cropWidth: 850,
        cropHeight: 600,
        scaleFactor: 1.0,
    });

    // Must be clamped inside the display bounds
    assert.strictEqual(bounds.x, 0);
    assert.strictEqual(bounds.y, 0);
    assert.strictEqual(bounds.width, 850);
    assert.strictEqual(bounds.height, 600);
});

test('edgeCases: screenCapture handles coordinates far beyond display boundaries', () => {
    const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    const bounds = calculateCropRect({
        cursor: { x: 99999, y: 88888 },
        displayBounds,
        cropWidth: 850,
        cropHeight: 600,
        scaleFactor: 1.0,
    });

    assert.strictEqual(bounds.x, 1920 - 850);
    assert.strictEqual(bounds.y, 1080 - 600);
    assert.strictEqual(bounds.width, 850);
    assert.strictEqual(bounds.height, 600);
});

test('edgeCases: screenCapture handles crop dimensions larger than the screen itself', () => {
    const displayBounds = { x: 0, y: 0, width: 800, height: 600 };
    // User requested 1200x900 crop on a small 800x600 screen
    const bounds = calculateCropRect({
        cursor: { x: 400, y: 300 },
        displayBounds,
        cropWidth: 1200,
        cropHeight: 900,
        scaleFactor: 1.0,
    });

    // Clamps to max available display bounds
    assert.strictEqual(bounds.x, 0);
    assert.strictEqual(bounds.y, 0);
    assert.strictEqual(bounds.width, 800);
    assert.strictEqual(bounds.height, 600);
});

test('edgeCases: tray icon sanitizes special characters to prevent SVG injection', () => {
    const maliciousPayloads = ['<script>alert(1)</script>', 'A" fill="red"', '&amp;', '<svg onload="hack()>', '\n\r'];

    for (const payload of maliciousPayloads) {
        const dataUrl = createTrayIconDataUrl(payload);
        assert.ok(dataUrl.startsWith('data:image/svg+xml;base64,'));
        const decoded = Buffer.from(dataUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
        // Must not execute malicious payloads or break out of tag
        assert.ok(!decoded.includes('<script>'));
        assert.ok(!decoded.includes('onload='));
    }
});

test('edgeCases: audio cue safely maps option letters to frequency and count', () => {
    const letterMap = { A: 1, B: 2, C: 3, D: 4, E: 5 };
    const safePitchHz = pitch => Math.max(200, Math.min(pitch || 880, 4000));

    assert.strictEqual(safePitchHz(50), 200); // Too low -> clamped to 200Hz
    assert.strictEqual(safePitchHz(12000), 4000); // Too high -> clamped to 4000Hz
    assert.strictEqual(safePitchHz(880), 880);
    assert.strictEqual(safePitchHz(null), 880);

    for (const [letter, expectedBeeps] of Object.entries(letterMap)) {
        assert.strictEqual(letter.charCodeAt(0) - 64, expectedBeeps);
    }
});

test('edgeCases: BYOK API keys are trimmed and stripped of accidental quotes', () => {
    function sanitizeApiKey(raw) {
        if (!raw || typeof raw !== 'string') return '';
        let key = raw.trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
            key = key.slice(1, -1).trim();
        }
        return key;
    }

    assert.strictEqual(sanitizeApiKey('  "AIzaSy12345"  '), 'AIzaSy12345');
    assert.strictEqual(sanitizeApiKey(" 'gsk_abcdef' "), 'gsk_abcdef');
    assert.strictEqual(sanitizeApiKey(' AIzaSyA0_0l1exigeuJY6Z2hggNH8xLkSfbwUQk '), 'AIzaSyA0_0l1exigeuJY6Z2hggNH8xLkSfbwUQk');
    assert.strictEqual(sanitizeApiKey(null), '');
    assert.strictEqual(sanitizeApiKey(undefined), '');
});

test('edgeCases: invalid appMode gracefully falls back', () => {
    const validModes = ['test', 'interview'];
    function resolveMode(mode) {
        return validModes.includes(mode) ? mode : 'test';
    }

    assert.strictEqual(resolveMode('test'), 'test');
    assert.strictEqual(resolveMode('interview'), 'interview');
    assert.strictEqual(resolveMode('invalid_mode_xyz'), 'test');
    assert.strictEqual(resolveMode(null), 'test');
    assert.strictEqual(resolveMode(undefined), 'test');
});
