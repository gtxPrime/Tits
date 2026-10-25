const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
    try {
        const rootDir = path.resolve(__dirname, '..');
        const srcPngPath = path.join(rootDir, 'icon.png');
        const outPngPath = path.join(rootDir, 'src/assets/logo.png');
        const outIcoPath = path.join(rootDir, 'src/assets/logo.ico');

        console.log('Reading from:', srcPngPath);
        if (!fs.existsSync(srcPngPath)) {
            console.error('File does not exist:', srcPngPath);
            process.exit(1);
        }

        // 1. Copy 512x512 icon.png to src/assets/logo.png
        fs.copyFileSync(srcPngPath, outPngPath);
        console.log('Copied to logo.png, size:', fs.statSync(outPngPath).size);

        // 2. Generate multi-resolution PNGs
        const img = nativeImage.createFromPath(srcPngPath);
        const sizes = [256, 128, 64, 48, 32, 16];
        const pngBuffers = [];

        for (const size of sizes) {
            const resized = img.resize({ width: size, height: size, quality: 'best' });
            const buf = resized.toPNG();
            pngBuffers.push({ size, buf });
            console.log(`Generated size ${size}x${size}: ${buf.length} bytes`);
        }

        // 3. Assemble ICO
        const count = pngBuffers.length;
        const headerSize = 6 + count * 16;
        let currentOffset = headerSize;

        const headerBuf = Buffer.alloc(headerSize);
        headerBuf.writeUInt16LE(0, 0); // reserved
        headerBuf.writeUInt16LE(1, 2); // type 1 = ICO
        headerBuf.writeUInt16LE(count, 4); // count

        for (let i = 0; i < count; i++) {
            const entryOffset = 6 + i * 16;
            const { size, buf } = pngBuffers[i];
            const byteWidth = size === 256 ? 0 : size;
            const byteHeight = size === 256 ? 0 : size;

            headerBuf.writeUInt8(byteWidth, entryOffset + 0);
            headerBuf.writeUInt8(byteHeight, entryOffset + 1);
            headerBuf.writeUInt8(0, entryOffset + 2);
            headerBuf.writeUInt8(0, entryOffset + 3);
            headerBuf.writeUInt16LE(1, entryOffset + 4); // planes
            headerBuf.writeUInt16LE(32, entryOffset + 6); // bit count
            headerBuf.writeUInt32LE(buf.length, entryOffset + 8); // bytes in res
            headerBuf.writeUInt32LE(currentOffset, entryOffset + 12); // image offset

            currentOffset += buf.length;
        }

        const totalIcoBuf = Buffer.concat([headerBuf, ...pngBuffers.map(p => p.buf)]);
        fs.writeFileSync(outIcoPath, totalIcoBuf);
        console.log('Generated logo.ico, size:', fs.statSync(outIcoPath).size);

        // 4. Generate 32x32 transparent PNG icon for the transparent idle tray feature
        const transparentImg = nativeImage.createFromBuffer(Buffer.alloc(32 * 32 * 4, 0), { width: 32, height: 32 });
        const transparentPngBuf = transparentImg.toPNG();
        fs.writeFileSync(path.join(rootDir, 'src/assets/tray_icons/transparent.png'), transparentPngBuf);

        // Generate 32x32 transparent .ico
        const tIcoHeader = Buffer.alloc(6 + 16);
        tIcoHeader.writeUInt16LE(0, 0);
        tIcoHeader.writeUInt16LE(1, 2);
        tIcoHeader.writeUInt16LE(1, 4);
        tIcoHeader.writeUInt8(32, 6);
        tIcoHeader.writeUInt8(32, 7);
        tIcoHeader.writeUInt8(0, 8);
        tIcoHeader.writeUInt8(0, 9);
        tIcoHeader.writeUInt16LE(1, 10);
        tIcoHeader.writeUInt16LE(32, 12);
        tIcoHeader.writeUInt32LE(transparentPngBuf.length, 14);
        tIcoHeader.writeUInt32LE(22, 18);
        fs.writeFileSync(path.join(rootDir, 'src/assets/tray_icons/transparent.ico'), Buffer.concat([tIcoHeader, transparentPngBuf]));
        console.log('Generated transparent tray icons');

        process.exit(0);
    } catch (err) {
        console.error('Error generating assets:', err);
        process.exit(1);
    }
});
