const test = require('node:test');
const assert = require('node:assert');
const { createTrayIconDataUrl } = require('../src/utils/tray');

test('tray: createTrayIconDataUrl generates valid SVG data URL for all option letters', () => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    for (const letter of letters) {
        const dataUrl = createTrayIconDataUrl(letter);
        assert.ok(dataUrl.startsWith('data:image/svg+xml;base64,'));

        const base64Str = dataUrl.replace('data:image/svg+xml;base64,', '');
        const decodedSvg = Buffer.from(base64Str, 'base64').toString('utf8');

        assert.ok(decodedSvg.includes('<svg'));
        assert.ok(decodedSvg.includes(letter), `SVG should render letter ${letter}`);
        assert.ok(decodedSvg.includes('#10b981'), 'Should have high-contrast emerald badge color');
    }
});

test('tray: createTrayIconDataUrl handles lowercase letters properly', () => {
    const dataUrl = createTrayIconDataUrl('b');
    const base64Str = dataUrl.replace('data:image/svg+xml;base64,', '');
    const decodedSvg = Buffer.from(base64Str, 'base64').toString('utf8');
    assert.ok(decodedSvg.includes('>B<'), 'Should normalize lowercase b to uppercase B');
});

test('tray: createTrayIconDataUrl falls back to default TITS icon when letter is null or invalid', () => {
    const nullUrl = createTrayIconDataUrl(null);
    const nullSvg = Buffer.from(nullUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
    assert.ok(nullSvg.includes('#06b6d4'), 'Default icon should include cyan brand accent');

    const invalidUrl = createTrayIconDataUrl('Z');
    const invalidSvg = Buffer.from(invalidUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
    assert.ok(invalidSvg.includes('#06b6d4'), 'Invalid letter should fall back to default brand icon');
});
