const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { createLetterBitmap, createLetterPngBuffer } = require('./bmpBadge');

let tray = null;
let currentAnswerLetter = null;
let mainWindowRef = null;
let onSolveCallback = null;

/**
 * Generate a dynamic 32x32 SVG data URL for tray icon
 * @param {string|null} letter - 'A' through 'Z', '0' through '9', or null for default icon
 */
function createTrayIconDataUrl(letter = null) {
    let svgContent = '';
    if (letter && /[A-Z0-9]/i.test(letter.toString().trim())) {
        const char = letter.toString().trim().toUpperCase()[0];
        // Emerald/Cyan high-contrast badge with the letter
        svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#0f172a"/>
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#10b981" stroke="#34d399" stroke-width="1.5"/>
            <text x="16" y="22" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">${char}</text>
        </svg>`.trim();
    } else {
        // Default TITS Tray Icon: Sleek cyan/violet stylized "T" badge
        svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#090d16"/>
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#06b6d4" opacity="0.2"/>
            <path d="M7 8h18v4h-6.5v13h-5V12H7V8z" fill="#06b6d4"/>
            <circle cx="24" cy="8" r="3" fill="#a855f7"/>
        </svg>`.trim();
    }

    const base64 = Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

function updateTrayMenu() {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
        {
            label: currentAnswerLetter ? `Last Answer: Option [${currentAnswerLetter}]` : 'Tits - Test Intelligence & Tutoring System',
            enabled: false,
        },
        { type: 'separator' },
        {
            label: 'Quick Exam Solve (Ctrl+Alt+Q)',
            click: () => {
                if (onSolveCallback) onSolveCallback();
            },
        },
        {
            label: 'Toggle Stealth Overlay',
            click: () => {
                if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
                if (mainWindowRef.isVisible()) {
                    mainWindowRef.hide();
                } else {
                    mainWindowRef.show();
                    mainWindowRef.focus();
                }
            },
        },
        {
            label: 'Reset Tray Answer Icon',
            click: () => {
                setTrayAnswer(null);
            },
        },
        { type: 'separator' },
        {
            label: 'Quit Tits',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
}

function getTrayIcon(letter = null) {
    if (letter && /[A-Z0-9]/i.test(letter.toString().trim())) {
        const char = letter.toString().trim().toUpperCase()[0];

        // 1. Prioritize pre-rendered 32x32 PNG badge via buffer (100% reliable inside app.asar and unpacked)
        const pngPath = path.join(__dirname, `../assets/tray_icons/badge_${char}.png`);
        if (fs.existsSync(pngPath)) {
            try {
                const buf = fs.readFileSync(pngPath);
                const img = nativeImage.createFromBuffer(buf);
                if (!img.isEmpty()) return img;
            } catch (e) {
                console.warn('[Tray] Failed to load PNG badge buffer:', e);
            }
        }

        // 2. Fallback to native in-memory PNG buffer
        try {
            const pngBuf = createLetterPngBuffer(char);
            const img = nativeImage.createFromBuffer(pngBuf);
            if (!img.isEmpty()) return img;
        } catch (e) {
            console.warn('[Tray] Error creating letter badge from PNG:', e);
        }

        // 3. Fallback to ICO if available
        const icoPath = path.join(__dirname, `../assets/tray_icons/badge_${char}.ico`);
        if (fs.existsSync(icoPath)) {
            try {
                const buf = fs.readFileSync(icoPath);
                const img = nativeImage.createFromBuffer(buf);
                if (!img.isEmpty()) return img;
            } catch (e) {}
        }

        // 4. Fallback to raw bitmap if PNG fails
        try {
            const rawBitmap = createLetterBitmap(char);
            const img = nativeImage.createFromBitmap(rawBitmap, { width: 32, height: 32 });
            if (!img.isEmpty()) return img;
        } catch (e) {}
    }

    // Default idle icon: use high-contrast 32x32 brand badge (badge_T)
    const idleBadgePng = path.join(__dirname, '../assets/tray_icons/badge_T.png');
    if (fs.existsSync(idleBadgePng)) {
        try {
            const buf = fs.readFileSync(idleBadgePng);
            const img = nativeImage.createFromBuffer(buf);
            if (!img.isEmpty()) return img;
        } catch (e) {}
    }

    const defaultIconPath = process.platform === 'win32' ? path.join(__dirname, '../assets/logo.ico') : path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(defaultIconPath)) {
        try {
            const buf = fs.readFileSync(defaultIconPath);
            const fallbackImg = nativeImage.createFromBuffer(buf);
            if (!fallbackImg.isEmpty()) return fallbackImg.resize({ width: 32, height: 32 });
        } catch (e) {}
    }

    // Guarantee non-empty image as ultimate fallback
    const fallbackPngBuf = createLetterPngBuffer('T');
    return nativeImage.createFromBuffer(fallbackPngBuf);
}

function initTray(mainWindow, onSolve) {
    mainWindowRef = mainWindow;
    onSolveCallback = onSolve;

    if (tray && !tray.isDestroyed()) {
        return tray;
    }

    try {
        const icon = getTrayIcon(null);
        global.__last_tray_image = icon;
        tray = new Tray(icon);
        // Retain permanent global reference to prevent V8 garbage collection dropping the HICON
        global.__tits_tray = tray;

        tray.setToolTip('Tits - Test Intelligence & Tutoring System (BYOK)');
        updateTrayMenu();

        // Single click toggles window visibility
        tray.on('click', () => {
            if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
            if (mainWindowRef.isVisible()) {
                mainWindowRef.hide();
            } else {
                mainWindowRef.show();
                mainWindowRef.focus();
            }
        });

        // Double click brings window to front
        tray.on('double-click', () => {
            if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
            mainWindowRef.show();
            mainWindowRef.focus();
        });

        console.log('[Tray] Initialized successfully');
    } catch (err) {
        console.error('[Tray] Error initializing tray:', err);
    }

    return tray;
}

function setTrayAnswer(letter, summary = '') {
    currentAnswerLetter = letter ? letter.toUpperCase() : null;
    const icon = getTrayIcon(currentAnswerLetter);

    if (!tray || tray.isDestroyed()) {
        initTray(mainWindowRef, onSolveCallback);
    }

    if (tray && !tray.isDestroyed()) {
        try {
            global.__last_tray_image = icon;
            tray.setImage(icon);

            if (currentAnswerLetter) {
                const tip = `[Tits] Option [${currentAnswerLetter}] ${summary ? ': ' + summary.slice(0, 80) : ''}`;
                tray.setToolTip(tip);
            } else {
                tray.setToolTip('Tits - Test Intelligence & Tutoring System (BYOK)');
            }

            updateTrayMenu();
        } catch (err) {
            console.error('[Tray] Error updating tray answer:', err);
        }
    }
}

function refreshTrayIcon() {
    setTrayAnswer(currentAnswerLetter);
}

function destroyTray() {
    if (tray) {
        try {
            tray.destroy();
        } catch (e) {}
        tray = null;
        global.__tits_tray = null;
    }
}

module.exports = {
    initTray,
    setTrayAnswer,
    refreshTrayIcon,
    destroyTray,
    createTrayIconDataUrl,
    getTrayIcon,
};
