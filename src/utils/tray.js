const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

let tray = null;
let currentAnswerLetter = null;
let mainWindowRef = null;
let onSolveCallback = null;

/**
 * Generate a dynamic 32x32 PNG buffer for tray icon
 * @param {string|null} letter - 'A', 'B', 'C', 'D', 'E' or null for default icon
 */
function createTrayIconDataUrl(letter = null) {
    // Generate a simple SVG and convert to data URL
    let svgContent = '';
    if (letter && ['A', 'B', 'C', 'D', 'E'].includes(letter.toUpperCase())) {
        const char = letter.toUpperCase();
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
            label: currentAnswerLetter ? `Last Answer: Option [${currentAnswerLetter}]` : 'TITS - Test Intelligence & Tutoring System',
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
                    mainWindowRef.showInactive();
                }
            },
        },
        {
            label: '🔄 Reset Tray Answer Icon',
            click: () => {
                setTrayAnswer(null);
            },
        },
        { type: 'separator' },
        {
            label: '❌ Quit TITS',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
}

const { createLetterBmpBuffer } = require('./bmpBadge');

function getTrayIcon(letter = null) {
    if (letter && ['A', 'B', 'C', 'D', 'E'].includes(letter.toUpperCase())) {
        try {
            const bmp = createLetterBmpBuffer(letter.toUpperCase());
            const img = nativeImage.createFromBuffer(bmp);
            if (!img.isEmpty()) return img;
        } catch (e) {
            console.warn('[Tray] Error creating letter BMP:', e);
        }
    }

    const iconPath = process.platform === 'win32' ? path.join(__dirname, '../assets/logo.ico') : path.join(__dirname, '../assets/logo.png');
    return nativeImage.createFromPath(iconPath);
}

function initTray(mainWindow, onSolve) {
    mainWindowRef = mainWindow;
    onSolveCallback = onSolve;

    try {
        const icon = getTrayIcon(null);
        tray = new Tray(icon);

        tray.setToolTip('TITS - Test Intelligence & Tutoring System (BYOK)');
        updateTrayMenu();

        tray.on('click', () => {
            if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
            if (mainWindowRef.isVisible()) {
                mainWindowRef.hide();
            } else {
                mainWindowRef.showInactive();
            }
        });

        tray.on('double-click', () => {
            if (onSolveCallback) onSolveCallback();
        });

        console.log('[Tray] Initialized successfully');
    } catch (err) {
        console.error('[Tray] Error initializing tray:', err);
    }

    return tray;
}

function setTrayAnswer(letter, summary = '') {
    currentAnswerLetter = letter ? letter.toUpperCase() : null;
    if (!tray) return;

    try {
        const icon = getTrayIcon(currentAnswerLetter);
        tray.setImage(icon);

        if (currentAnswerLetter) {
            const tip = `[TITS] Answer: [${currentAnswerLetter}] ${summary ? '— ' + summary.slice(0, 80) : ''}`;
            tray.setToolTip(tip);
        } else {
            tray.setToolTip('TITS - Test Intelligence & Tutoring System (BYOK)');
        }

        updateTrayMenu();
    } catch (err) {
        console.error('[Tray] Error updating tray answer:', err);
    }
}

function destroyTray() {
    if (tray) {
        tray.destroy();
        tray = null;
    }
}

module.exports = {
    initTray,
    setTrayAnswer,
    destroyTray,
    createTrayIconDataUrl,
};
