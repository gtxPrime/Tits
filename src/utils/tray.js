const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

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

const { createLetterBitmap, createLetterPngBuffer } = require('./bmpBadge');

function getTrayIcon(letter = null) {
    if (letter && /[A-Z0-9]/i.test(letter.toString().trim())) {
        try {
            const char = letter.toString().trim().toUpperCase()[0];
            const pngBuf = createLetterPngBuffer(char);
            const img = nativeImage.createFromBuffer(pngBuf);
            if (!img.isEmpty()) return img;
        } catch (e) {
            console.warn('[Tray] Error creating letter badge from PNG:', e);
        }

        // Fallback to raw bitmap if PNG fails
        try {
            const char = letter.toString().trim().toUpperCase()[0];
            const rawBitmap = createLetterBitmap(char);
            const img = nativeImage.createFromBitmap(rawBitmap, { width: 32, height: 32 });
            if (!img.isEmpty()) return img;
        } catch (e) {}
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
    const icon = getTrayIcon(currentAnswerLetter);

    // 1. Update System Tray Icon & Tooltip
    if (tray) {
        try {
            tray.setImage(icon);

            if (currentAnswerLetter) {
                const tip = `[TITS] Option [${currentAnswerLetter}] ${summary ? '— ' + summary.slice(0, 80) : ''}`;
                tray.setToolTip(tip);
            } else {
                tray.setToolTip('TITS - Test Intelligence & Tutoring System (BYOK)');
            }

            updateTrayMenu();
        } catch (err) {
            console.error('[Tray] Error updating tray answer:', err);
        }
    }

    // 2. Update Windows Taskbar Window (Icon, Overlay Badge, Title, and Thumbnail Tooltip)
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        try {
            if (currentAnswerLetter) {
                // A. Window Title visible in Taskbar button / preview
                mainWindowRef.setTitle(`[Option ${currentAnswerLetter}] ${summary ? summary.slice(0, 60) : 'Solved'} — TITS`);

                // B. Taskbar App Icon
                mainWindowRef.setIcon(icon);

                // C. Windows Taskbar Overlay Badge (shows letter badge on taskbar button)
                if (process.platform === 'win32') {
                    mainWindowRef.setOverlayIcon(icon, `Option ${currentAnswerLetter}`);
                    mainWindowRef.setThumbnailToolTip(`Option [${currentAnswerLetter}]: ${summary || ''}`);
                }

                // D. Flash Taskbar Button so user spots the answer immediately
                mainWindowRef.flashFrame(true);
            } else {
                mainWindowRef.setTitle('TITS - Test Intelligence & Tutoring System');
                const defaultIcon = getTrayIcon(null);
                mainWindowRef.setIcon(defaultIcon);
                if (process.platform === 'win32') {
                    mainWindowRef.setOverlayIcon(null, '');
                    mainWindowRef.setThumbnailToolTip('TITS - Test Intelligence & Tutoring System');
                }
            }
        } catch (err) {
            console.error('[Tray] Error updating taskbar window:', err);
        }
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
    getTrayIcon,
};
