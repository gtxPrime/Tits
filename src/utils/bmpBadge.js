function createLetterBmpBuffer(letter) {
    const width = 32;
    const height = 32;
    const pixelBytes = width * height * 4;
    const fileSize = 54 + pixelBytes;

    const buffer = Buffer.alloc(fileSize);

    // Bitmap File Header (14 bytes)
    buffer.write('BM', 0); // Signature
    buffer.writeUInt32LE(fileSize, 2); // File size
    buffer.writeUInt16LE(0, 6); // Reserved
    buffer.writeUInt16LE(0, 8); // Reserved
    buffer.writeUInt32LE(54, 10); // Offset to pixel data

    // DIB Header (BITMAPINFOHEADER - 40 bytes)
    buffer.writeUInt32LE(40, 14); // Header size
    buffer.writeInt32LE(width, 18); // Width
    buffer.writeInt32LE(-height, 22); // Height (negative for top-down)
    buffer.writeUInt16LE(1, 26); // Planes
    buffer.writeUInt16LE(32, 28); // Bits per pixel (32-bit BGRA)
    buffer.writeUInt32LE(0, 30); // Compression (BI_RGB)
    buffer.writeUInt32LE(pixelBytes, 34); // Image size
    buffer.writeInt32LE(2835, 38); // X pixels per meter (72 DPI)
    buffer.writeInt32LE(2835, 42); // Y pixels per meter (72 DPI)
    buffer.writeUInt32LE(0, 46); // Total colors
    buffer.writeUInt32LE(0, 50); // Important colors

    // Simple 5x7 font bitmaps for A, B, C, D, E
    const glyphs = {
        A: [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
        ],
        B: [
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 0],
        ],
        C: [
            [0, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [0, 1, 1, 1],
        ],
        D: [
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 1, 1, 0],
        ],
        E: [
            [1, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 1],
        ],
    };

    const glyph = glyphs[letter ? letter.toUpperCase() : ''] || null;

    // Fill pixels (BGRA format)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = 54 + (y * width + x) * 4;

            // Outer rounded rect border check
            const inBadge = x >= 2 && x <= 29 && y >= 2 && y <= 29;
            const inCorner = (x <= 4 || x >= 27) && (y <= 4 || y >= 27);

            if (inBadge && !inCorner) {
                // Background of badge: Emerald #10b981 (BGRA: 129, 185, 16, 255)
                let b = 129,
                    g = 185,
                    r = 16,
                    a = 255;

                // Scale glyph up (4x) in center: glyph is 4x5 -> rendered as 16x20 at x=8, y=6
                if (glyph) {
                    const gx = Math.floor((x - 8) / 4);
                    const gy = Math.floor((y - 6) / 4);
                    if (gy >= 0 && gy < glyph.length && gx >= 0 && gx < glyph[gy].length) {
                        if (glyph[gy][gx]) {
                            // White text: #ffffff
                            b = 255;
                            g = 255;
                            r = 255;
                            a = 255;
                        }
                    }
                }

                buffer[offset] = b;
                buffer[offset + 1] = g;
                buffer[offset + 2] = r;
                buffer[offset + 3] = a;
            } else {
                // Transparent pixel outside badge
                buffer[offset] = 0;
                buffer[offset + 1] = 0;
                buffer[offset + 2] = 0;
                buffer[offset + 3] = 0;
            }
        }
    }

    return buffer;
}

module.exports = { createLetterBmpBuffer };
