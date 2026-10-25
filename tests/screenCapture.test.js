const test = require('node:test');
const assert = require('node:assert');

// Pure function simulation of screenCapture coordinate and crop calculation
function calculateCropRect({ cursor, displayBounds, scaleFactor, cropWidth, cropHeight }) {
    const physicalWidth = Math.round(displayBounds.width * scaleFactor);
    const physicalHeight = Math.round(displayBounds.height * scaleFactor);

    const relX = Math.round((cursor.x - displayBounds.x) * scaleFactor);
    const relY = Math.round((cursor.y - displayBounds.y) * scaleFactor);

    const cropW = Math.min(physicalWidth, Math.round(cropWidth * scaleFactor));
    const cropH = Math.min(physicalHeight, Math.round(cropHeight * scaleFactor));

    let startX = Math.round(relX - cropW / 2);
    let startY = Math.round(relY - cropH / 2);

    // Clamp inside physical bounds
    if (startX < 0) startX = 0;
    if (startY < 0) startY = 0;
    if (startX + cropW > physicalWidth) startX = physicalWidth - cropW;
    if (startY + cropH > physicalHeight) startY = physicalHeight - cropH;

    return {
        x: Math.max(0, startX),
        y: Math.max(0, startY),
        width: Math.max(10, cropW),
        height: Math.max(10, cropH),
    };
}

test('screenCapture: centers crop box at cursor coordinate', () => {
    const rect = calculateCropRect({
        cursor: { x: 960, y: 540 },
        displayBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1,
        cropWidth: 800,
        cropHeight: 600,
    });

    assert.strictEqual(rect.x, 960 - 400); // 560
    assert.strictEqual(rect.y, 540 - 300); // 240
    assert.strictEqual(rect.width, 800);
    assert.strictEqual(rect.height, 600);
});

test('screenCapture: clamps correctly when cursor is at top-left edge (0,0)', () => {
    const rect = calculateCropRect({
        cursor: { x: 10, y: 15 },
        displayBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1,
        cropWidth: 800,
        cropHeight: 600,
    });

    assert.strictEqual(rect.x, 0, 'X must not be negative');
    assert.strictEqual(rect.y, 0, 'Y must not be negative');
    assert.strictEqual(rect.width, 800);
    assert.strictEqual(rect.height, 600);
});

test('screenCapture: clamps correctly when cursor is near bottom-right edge', () => {
    const rect = calculateCropRect({
        cursor: { x: 1910, y: 1070 },
        displayBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1,
        cropWidth: 800,
        cropHeight: 600,
    });

    assert.strictEqual(rect.x, 1920 - 800); // 1120
    assert.strictEqual(rect.y, 1080 - 600); // 480
    assert.strictEqual(rect.x + rect.width, 1920);
    assert.strictEqual(rect.y + rect.height, 1080);
});

test('screenCapture: handles HiDPI scale factor properly (e.g. 1.5x scaling)', () => {
    const rect = calculateCropRect({
        cursor: { x: 500, y: 400 },
        displayBounds: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.5,
        cropWidth: 800,
        cropHeight: 600,
    });

    assert.strictEqual(rect.width, 800 * 1.5);
    assert.strictEqual(rect.height, 600 * 1.5);
    assert.ok(rect.x >= 0);
    assert.ok(rect.y >= 0);
});
