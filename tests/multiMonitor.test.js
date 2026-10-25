const test = require('node:test');
const assert = require('node:assert');
const { calculateCropRect } = require('../src/utils/screenCapture');

test('multiMonitor: secondary display positioned to the left (negative X coordinates)', () => {
    // Secondary monitor is 1920x1080 at x: -1920, y: 0
    const leftDisplayBounds = { x: -1920, y: 0, width: 1920, height: 1080 };
    const cursor = { x: -960, y: 540 }; // Dead center of left display

    const rect = calculateCropRect({
        cursor,
        displayBounds: leftDisplayBounds,
        cropWidth: 850,
        cropHeight: 600,
        scaleFactor: 1.0,
    });

    // relX = -960 - (-1920) = 960
    // startX = 960 - 425 = 535
    assert.strictEqual(rect.x, 535);
    assert.strictEqual(rect.y, 240);
    assert.strictEqual(rect.width, 850);
    assert.strictEqual(rect.height, 600);
});

test('multiMonitor: secondary display positioned above (negative Y coordinates)', () => {
    // Secondary display is 1920x1080 above primary display
    const topDisplayBounds = { x: 0, y: -1080, width: 1920, height: 1080 };
    const cursor = { x: 960, y: -540 }; // Center of top display

    const rect = calculateCropRect({
        cursor,
        displayBounds: topDisplayBounds,
        cropWidth: 800,
        cropHeight: 500,
        scaleFactor: 1.0,
    });

    assert.strictEqual(rect.x, 960 - 400);
    assert.strictEqual(rect.y, 540 - 250);
    assert.strictEqual(rect.width, 800);
    assert.strictEqual(rect.height, 500);
});

test('multiMonitor: 4K display with 200% DPI scaling (scaleFactor = 2.0)', () => {
    // 4K monitor: logical 1920x1080, physical 3840x2160
    const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    const cursor = { x: 960, y: 540 };

    const rect = calculateCropRect({
        cursor,
        displayBounds,
        cropWidth: 850,
        cropHeight: 600,
        scaleFactor: 2.0,
    });

    // Physical width = 3840, physical height = 2160
    // Physical crop width = 1700, physical crop height = 1200
    // relX = 960 * 2 = 1920
    // startX = 1920 - 850 = 1070
    assert.strictEqual(rect.x, 1070);
    assert.strictEqual(rect.y, 480);
    assert.strictEqual(rect.width, 1700);
    assert.strictEqual(rect.height, 1200);
});

test('multiMonitor: Surface Laptop with 150% DPI scaling (scaleFactor = 1.5)', () => {
    const displayBounds = { x: 0, y: 0, width: 1500, height: 1000 };
    const cursor = { x: 750, y: 500 };

    const rect = calculateCropRect({
        cursor,
        displayBounds,
        cropWidth: 600,
        cropHeight: 400,
        scaleFactor: 1.5,
    });

    assert.strictEqual(rect.width, 900); // 600 * 1.5
    assert.strictEqual(rect.height, 600); // 400 * 1.5
    assert.ok(rect.x >= 0 && rect.x + rect.width <= 2250);
    assert.ok(rect.y >= 0 && rect.y + rect.height <= 1500);
});

test('multiMonitor: cursor on exact outer corner (0, 0) clamps safely', () => {
    const displayBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    const cursor = { x: 0, y: 0 };

    const rect = calculateCropRect({
        cursor,
        displayBounds,
        cropWidth: 850,
        cropHeight: 600,
        scaleFactor: 1.0,
    });

    assert.strictEqual(rect.x, 0);
    assert.strictEqual(rect.y, 0);
    assert.strictEqual(rect.width, 850);
    assert.strictEqual(rect.height, 600);
});
