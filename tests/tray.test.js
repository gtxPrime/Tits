const test = require('node:test');
const assert = require('node:assert');
const { createTrayIconDataUrl } = require('../src/utils/tray');
const { createLetterBitmap, createLetterBmpBuffer, createLetterPngBuffer } = require('../src/utils/bmpBadge');

test('tray: createTrayIconDataUrl generates valid SVG data URL for all option letters A-Z', () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'Z'];
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
    const dataUrl = createTrayIconDataUrl('z');
    const base64Str = dataUrl.replace('data:image/svg+xml;base64,', '');
    const decodedSvg = Buffer.from(base64Str, 'base64').toString('utf8');
    assert.ok(decodedSvg.includes('>Z<'), 'Should normalize lowercase z to uppercase Z');
});

test('tray: createTrayIconDataUrl falls back to default TITS icon when letter is null or invalid', () => {
    const nullUrl = createTrayIconDataUrl(null);
    const nullSvg = Buffer.from(nullUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
    assert.ok(nullSvg.includes('#06b6d4'), 'Default icon should include cyan brand accent');

    const invalidUrl = createTrayIconDataUrl('$$$');
    const invalidSvg = Buffer.from(invalidUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
    assert.ok(invalidSvg.includes('#06b6d4'), 'Invalid character should fall back to default brand icon');
});

test('tray: bmpBadge creates valid raw 32x32 BGRA bitmap and BMP file for any letter A-Z', () => {
    for (const char of ['A', 'C', 'Z', '5']) {
        const raw = createLetterBitmap(char);
        assert.strictEqual(raw.length, 32 * 32 * 4, 'Raw buffer must be 4096 bytes');

        const bmp = createLetterBmpBuffer(char);
        assert.strictEqual(bmp.length, 54 + 32 * 32 * 4, 'BMP file buffer must be 4150 bytes');
        assert.strictEqual(bmp.toString('ascii', 0, 2), 'BM', 'Must start with BM header');
    }
});

test('tray: bmpBadge creates valid standard PNG file buffer for all option letters A-Z', () => {
    const expectedSig = '89504e470d0a1a0a';
    for (const char of ['A', 'B', 'C', 'D', 'E', 'Z']) {
        const png = createLetterPngBuffer(char);
        assert.ok(png.length > 100, 'PNG buffer must have content');
        assert.strictEqual(png.subarray(0, 8).toString('hex'), expectedSig, 'Must have standard PNG magic signature');
    }
});
