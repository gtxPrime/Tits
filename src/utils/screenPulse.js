const { BrowserWindow, screen } = require('electron');

let pulseWindow = null;

function createPulseWindow() {
    if (pulseWindow && !pulseWindow.isDestroyed()) {
        return pulseWindow;
    }

    let display = screen.getPrimaryDisplay();
    try {
        const cursor = screen.getCursorScreenPoint();
        display = screen.getDisplayNearestPoint(cursor) || display;
    } catch (e) {}

    const { x, y, width, height } = display.bounds;

    pulseWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        focusable: false,
        show: false,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Make topmost above all windows (including fullscreen browsers)
    pulseWindow.setAlwaysOnTop(true, 'screen-saver');
    pulseWindow.setIgnoreMouseEvents(true, { forward: true });
    pulseWindow.setContentProtection(true); // Excluded from screen recordings and shares

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            html, body {
                margin: 0;
                padding: 0;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
                background: transparent;
                pointer-events: none;
            }
            #glow {
                position: fixed;
                inset: 0;
                pointer-events: none;
                box-shadow: inset 0 0 0px rgba(0,0,0,0);
                transition: box-shadow 0.15s ease-out;
            }
        </style>
    </head>
    <body>
        <div id="glow"></div>
        <script>
            window.flash = function(count, color) {
                const el = document.getElementById('glow');
                const glowColor = color || 'rgba(250, 204, 21, 0.95)';
                let n = 0;
                const interval = setInterval(() => {
                    if (n >= count) {
                        clearInterval(interval);
                        el.style.boxShadow = 'inset 0 0 0px rgba(0,0,0,0)';
                        return;
                    }
                    n++;
                    el.style.boxShadow = 'inset 0 0 85px 28px ' + glowColor;
                    setTimeout(() => {
                        el.style.boxShadow = 'inset 0 0 0px rgba(0,0,0,0)';
                    }, 200);
                }, 400);
            };
        </script>
    </body>
    </html>
    `;

    pulseWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    return pulseWindow;
}

function initPulseWindow() {
    createPulseWindow();
}

/**
 * Trigger fullscreen stealth edge glow pulse across the monitor
 * @param {number} count - Number of pulses (1=A, 2=B, 3=C, ...)
 * @param {string} color - CSS color for the edge glow
 */
function triggerFullscreenPulse(count = 1, color = '#facc15') {
    try {
        const win = createPulseWindow();

        // Reposition to the monitor where the cursor currently is
        try {
            const cursor = screen.getCursorScreenPoint();
            const display = screen.getDisplayNearestPoint(cursor);
            if (display) {
                win.setBounds(display.bounds);
            }
        } catch (e) {}

        win.showInactive();

        // Execute flash with self-polling to ensure page has loaded
        const js = `
            (function() {
                function run() {
                    if (typeof window.flash === 'function') {
                        window.flash(${count}, '${color}');
                    } else {
                        setTimeout(run, 40);
                    }
                }
                run();
            })();
        `;
        win.webContents.executeJavaScript(js).catch(() => {});

        const totalDuration = count * 400 + 700;
        setTimeout(() => {
            if (win && !win.isDestroyed()) {
                win.hide();
            }
        }, totalDuration);
    } catch (err) {
        console.error('[ScreenPulse] Error triggering screen pulse:', err);
    }
}

function destroyPulseWindow() {
    if (pulseWindow && !pulseWindow.isDestroyed()) {
        pulseWindow.destroy();
        pulseWindow = null;
    }
}

module.exports = {
    initPulseWindow,
    triggerFullscreenPulse,
    destroyPulseWindow,
};
