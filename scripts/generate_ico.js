const fs = require('fs');
const path = require('path');
const { app, nativeImage } = require('electron');

/**
 * Builds a valid Windows DIB buffer (BITMAPINFOHEADER + BGRA pixels + 1bpp AND mask) for an ICO entry.
 */
function createDibForSize(img, size) {
    const resized = img.resize({ width: size, height: size, quality: 'best' });
    const rawBitmap = resized.toBitmap(); // BGRA format, top-to-bottom

    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0); // biSize
    header.writeInt32LE(size, 4); // biWidth
    header.writeInt32LE(size * 2, 8); // biHeight = height * 2 (XOR + AND mask)
    header.writeUInt16LE(1, 12); // biPlanes
    header.writeUInt16LE(32, 14); // biBitCount (32bpp BGRA)
    header.writeUInt32LE(0, 16); // biCompression = BI_RGB
    header.writeUInt32LE(size * size * 4, 20); // biSizeImage
    header.writeInt32LE(0, 24); // biXPelsPerMeter
    header.writeInt32LE(0, 28); // biYPelsPerMeter
    header.writeUInt32LE(0, 32); // biClrUsed
    header.writeUInt32LE(0, 36); // biClrImportant

    // Windows DIB pixel data must be stored bottom-up
    const xorMask = Buffer.alloc(size * size * 4);
    const rowStride = size * 4;
    for (let y = 0; y < size; y++) {
        const srcOffset = y * rowStride;
        const destOffset = (size - 1 - y) * rowStride;
        rawBitmap.copy(xorMask, destOffset, srcOffset, srcOffset + rowStride);
    }

    // 1-bit-per-pixel AND mask (all zeroes for 32-bit alpha, padded to 32-bit boundary per row)
    const andRowBytes = Math.ceil(size / 32) * 4;
    const andMask = Buffer.alloc(andRowBytes * size, 0);

    return Buffer.concat([header, xorMask, andMask]);
}

app.whenReady().then(() => {
    try {
        const srcPngPath = path.resolve(__dirname, '../icon.png');
        const outIcoPath = path.resolve(__dirname, '../src/assets/logo.ico');
        const outPngPath = path.resolve(__dirname, '../src/assets/logo.png');

        // Ensure logo.png matches icon.png
        fs.copyFileSync(srcPngPath, outPngPath);
        console.log('Synced icon.png to src/assets/logo.png');

        const img = nativeImage.createFromPath(srcPngPath);
        if (img.isEmpty()) {
            throw new Error('Failed to load icon from ' + srcPngPath);
        }

        const sizes = [256, 128, 64, 48, 32, 16];
        const frames = [];

        for (const size of sizes) {
            if (size === 256) {
                // 256x256 is supported as PNG in Windows Vista+
                const resized = img.resize({ width: 256, height: 256, quality: 'best' });
                const pngBuf = resized.toPNG();
                frames.push({ size: 256, buf: pngBuf });
            } else {
                // Sizes < 256 MUST be uncompressed DIB bitmaps for Windows Explorer & rcedit
                const dibBuf = createDibForSize(img, size);
                frames.push({ size, buf: dibBuf });
            }
        }

        const count = frames.length;
        const headerSize = 6 + count * 16;
        const headerBuf = Buffer.alloc(headerSize);

        headerBuf.writeUInt16LE(0, 0); // idReserved
        headerBuf.writeUInt16LE(1, 2); // idType = 1 (ICO)
        headerBuf.writeUInt16LE(count, 4); // idCount

        let currentOffset = headerSize;
        for (let i = 0; i < count; i++) {
            const entryOffset = 6 + i * 16;
            const { size, buf } = frames[i];
            const byteWidth = size === 256 ? 0 : size;
            const byteHeight = size === 256 ? 0 : size;

            headerBuf.writeUInt8(byteWidth, entryOffset + 0); // bWidth
            headerBuf.writeUInt8(byteHeight, entryOffset + 1); // bHeight
            headerBuf.writeUInt8(0, entryOffset + 2); // bColorCount
            headerBuf.writeUInt8(0, entryOffset + 3); // bReserved
            headerBuf.writeUInt16LE(1, entryOffset + 4); // wPlanes
            headerBuf.writeUInt16LE(32, entryOffset + 6); // wBitCount
            headerBuf.writeUInt32LE(buf.length, entryOffset + 8); // dwBytesInRes
            headerBuf.writeUInt32LE(currentOffset, entryOffset + 12); // dwImageOffset

            currentOffset += buf.length;
        }

        const fullIcoBuf = Buffer.concat([headerBuf, ...frames.map(f => f.buf)]);
        fs.writeFileSync(outIcoPath, fullIcoBuf);
        console.log(`Successfully generated ${outIcoPath} (${fullIcoBuf.length} bytes, ${count} frames)`);

        app.quit();
    } catch (e) {
        console.error('Error generating icon:', e);
        app.quit();
    }
});
