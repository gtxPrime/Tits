const { screen, desktopCapturer } = require('electron');

/**
 * Capture either full screen or a cropped region centered at the mouse cursor
 * @param {Object} options
 * @param {'cursor_crop'|'fullscreen'} [options.mode='cursor_crop']
 * @param {number} [options.cropWidth=850]
 * @param {number} [options.cropHeight=600]
 * @returns {Promise<{ base64Data: string, width: number, height: number, cursor: { x: number, y: number } }>}
 */
async function captureScreenRegion(options = {}) {
    const mode = options.mode || 'cursor_crop';
    const targetCropW = options.cropWidth || 850;
    const targetCropH = options.cropHeight || 600;

    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint) || screen.getPrimaryDisplay();
    const scaleFactor = display.scaleFactor || 1;

    const physicalWidth = Math.round(display.bounds.width * scaleFactor);
    const physicalHeight = Math.round(display.bounds.height * scaleFactor);

    console.log(
        `[ScreenCapture] Cursor at (${cursorPoint.x}, ${cursorPoint.y}), display size: ${physicalWidth}x${physicalHeight}, scale: ${scaleFactor}`
    );

    const captureW = Math.min(2560, physicalWidth);
    const captureH = Math.min(1440, physicalHeight);

    const sourcesPromise = desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
            width: captureW,
            height: captureH,
        },
    });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Screen capture timed out after 6 seconds')), 6000));

    const sources = await Promise.race([sourcesPromise, timeoutPromise]);

    if (!sources || sources.length === 0) {
        throw new Error('No screen capture sources available');
    }

    // Match source by display id if possible or use primary/first
    let selectedSource = sources[0];
    if (sources.length > 1) {
        const matched = sources.find(s => s.display_id === display.id.toString());
        if (matched) selectedSource = matched;
    }

    let finalImage = selectedSource.thumbnail;

    if (mode === 'cursor_crop') {
        const cropRect = calculateCropRect({
            cursor: cursorPoint,
            displayBounds: display.bounds,
            scaleFactor,
            cropWidth: targetCropW,
            cropHeight: targetCropH,
        });

        // Ensure cropRect stays strictly within actual thumbnail dimensions to prevent native out-of-bounds errors
        const actualSize = finalImage.getSize();
        if (actualSize.width > 0 && actualSize.height > 0) {
            const safeX = Math.max(0, Math.min(cropRect.x, actualSize.width - 1));
            const safeY = Math.max(0, Math.min(cropRect.y, actualSize.height - 1));
            const safeW = Math.max(1, Math.min(cropRect.width, actualSize.width - safeX));
            const safeH = Math.max(1, Math.min(cropRect.height, actualSize.height - safeY));

            console.log(`[ScreenCapture] Cropping around cursor: [x:${safeX}, y:${safeY}, w:${safeW}, h:${safeH}]`);
            finalImage = finalImage.crop({ x: safeX, y: safeY, width: safeW, height: safeH });
        }
    }

    // Downscale if very large for fast AI transmission
    const imgSize = finalImage.getSize();
    let resultImage = finalImage;
    if (imgSize.width > 1280) {
        const newHeight = Math.round(imgSize.height * (1280 / imgSize.width));
        resultImage = finalImage.resize({ width: 1280, height: newHeight, quality: 'good' });
    }

    const jpegBuffer = resultImage.toJPEG(85);
    const base64Data = jpegBuffer.toString('base64');

    return {
        base64Data,
        width: resultImage.getSize().width,
        height: resultImage.getSize().height,
        cursor: cursorPoint,
    };
}

/**
 * Pure calculation function for region crop bounds
 */
function calculateCropRect({ cursor, displayBounds, scaleFactor = 1, cropWidth = 850, cropHeight = 600 }) {
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
    if (startX + cropW > physicalWidth) startX = Math.max(0, physicalWidth - cropW);
    if (startY + cropH > physicalHeight) startY = Math.max(0, physicalHeight - cropH);

    return {
        x: Math.max(0, startX),
        y: Math.max(0, startY),
        width: Math.min(physicalWidth, cropW),
        height: Math.min(physicalHeight, cropH),
    };
}

module.exports = {
    captureScreenRegion,
    calculateCropRect,
};
