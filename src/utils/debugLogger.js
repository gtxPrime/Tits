const fs = require('fs');
const path = require('path');
const os = require('os');
const { app, screen, shell, dialog, clipboard } = require('electron');
const { getConfigDir, getPreferences, getCredentials } = require('../storage');

let logFilePath = null;
const memoryLogs = [];
const MAX_MEMORY_LOGS = 1000;

function getLogPath() {
    if (!logFilePath) {
        const configDir = getConfigDir();
        fs.mkdirSync(configDir, { recursive: true });
        logFilePath = path.join(configDir, 'logs.txt');
    }
    return logFilePath;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const gb = (bytes / (1024 * 1024 * 1024)).toFixed(2);
    return `${gb} GB`;
}

function maskKey(key) {
    if (!key || typeof key !== 'string') return 'Not configured';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '********';
    return `${trimmed.substring(0, 6)}...${trimmed.substring(trimmed.length - 4)}`;
}

/**
 * Initializes diagnostic log file and writes system capability dump
 */
function initializeDebugLogger() {
    const targetFile = getLogPath();
    const prefs = getPreferences() || {};
    const creds = getCredentials() || {};

    let displayInfo = 'Displays: Unknown';
    try {
        if (screen) {
            const displays = screen.getAllDisplays();
            const primary = screen.getPrimaryDisplay();
            displayInfo =
                `Detected ${displays.length} display(s)\n` +
                `Primary: ${primary.size.width}x${primary.size.height} (Scale: ${primary.scaleFactor}x, WorkArea: ${primary.workAreaSize.width}x${primary.workAreaSize.height})\n` +
                displays
                    .map(
                        (d, i) =>
                            `  [#${i + 1}] ID:${d.id} Bounds:[${d.bounds.x},${d.bounds.y},${d.bounds.width},${d.bounds.height}] Scale:${d.scaleFactor}x`
                    )
                    .join('\n');
        }
    } catch (e) {
        displayInfo = `Display query error: ${e.message}`;
    }

    const hasAudioDump = fs.existsSync(path.join(__dirname, '../assets/SystemAudioDump'));

    const header = [
        '================================================================================',
        'TITS (Test Intelligence & Tutoring System) - Cross-Platform Diagnostics Log',
        `Generated: ${new Date().toISOString()} (${new Date().toLocaleString()})`,
        '================================================================================',
        '',
        '[ENVIRONMENT & OPERATING SYSTEM]',
        `App Version   : ${app ? app.getVersion() : '1.0.0'}`,
        `Platform      : ${process.platform} (${os.type()} ${os.release()} ${os.arch()})`,
        `Node Runtime  : ${process.versions.node}`,
        `Electron      : ${process.versions.electron}`,
        `Chromium      : ${process.versions.chrome}`,
        `CPUs          : ${os.cpus() ? os.cpus().length : 'N/A'} cores (${os.cpus() && os.cpus()[0] ? os.cpus()[0].model : 'Unknown'})`,
        `System Memory : ${formatBytes(os.freemem())} free of ${formatBytes(os.totalmem())} total`,
        '',
        '[SCREENSHARE STEALTH & DISPLAY AFFINITY]',
        `Content Protection Support : ${process.platform === 'win32' ? 'Supported (SetWindowDisplayAffinity / WDA_EXCLUDEFROMCAPTURE)' : process.platform === 'darwin' ? 'Supported (NSWindowSharingNone & Mission Control suppression)' : 'Fallback (X11/Wayland software isolation)'}`,
        `Content Protection Setting : ${prefs.contentProtection ? 'ENABLED' : 'DISABLED'}`,
        `Background Transparency   : ${typeof prefs.backgroundTransparency === 'number' ? prefs.backgroundTransparency : 0.8}`,
        displayInfo,
        '',
        '[AUDIO SUBSYSTEM]',
        `SystemAudioDump (macOS) : ${hasAudioDump ? 'Present' : 'Not installed'}`,
        `Platform Audio Capture  : ${process.platform === 'darwin' ? 'Dual-channel loopback via SystemAudioDump' : process.platform === 'win32' ? 'Windows Media Loopback' : 'PulseAudio / ALSA Loopback'}`,
        '',
        '[HARDWARE & INPUT HOOKS]',
        `CapsLock LED Controller : ${process.platform === 'win32' ? 'Supported (Native User32 API)' : 'Software simulated fallback (non-Windows)'}`,
        `Mouse Click-Hold Trigger: ${process.platform === 'win32' ? 'Supported (Native User32 GetAsyncKeyState)' : 'Global Keyboard Shortcut preferred (non-Windows)'}`,
        '',
        '[AI PROVIDERS & STORAGE]',
        `Config Directory        : ${getConfigDir()}`,
        `Active Operating Mode   : ${prefs.appMode || 'test'}`,
        `Active Vision Model     : ${prefs.visionModel || 'gemini-2.5-flash'}`,
        `Gemini API Key Status   : ${maskKey(creds.geminiApiKey)}`,
        `Groq API Key Status     : ${maskKey(creds.groqApiKey)}`,
        '================================================================================',
        '',
        `[${new Date().toISOString()}] [INIT] Logger initialized successfully. Beginning diagnostic event recording...`,
        '',
    ].join('\n');

    try {
        fs.writeFileSync(targetFile, header, 'utf8');
        console.log('[DebugLogger] Diagnostic log initialized at:', targetFile);
    } catch (e) {
        console.error('[DebugLogger] Failed to write header to log file:', e);
    }
}

function writeLog(level, category, message, details = null) {
    const timestamp = new Date().toISOString();
    let line = `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
    if (details !== null && details !== undefined) {
        if (typeof details === 'object') {
            try {
                line += ` | ${JSON.stringify(details)}`;
            } catch (e) {
                line += ` | [Object]`;
            }
        } else {
            line += ` | ${details}`;
        }
    }

    // Keep in memory
    memoryLogs.push(line);
    if (memoryLogs.length > MAX_MEMORY_LOGS) {
        memoryLogs.shift();
    }

    // Append to file
    try {
        const file = getLogPath();
        fs.appendFileSync(file, line + '\n', 'utf8');
    } catch (e) {
        console.error('[DebugLogger] Failed to append log line:', e.message);
    }

    // Also output to console
    if (level === 'error') {
        console.error(`[TITS:${category}] ${message}`, details || '');
    } else if (level === 'warn') {
        console.warn(`[TITS:${category}] ${message}`, details || '');
    } else {
        console.log(`[TITS:${category}] ${message}`, details || '');
    }
}

const debugLogger = {
    init: initializeDebugLogger,
    info: (category, message, details) => writeLog('info', category, message, details),
    warn: (category, message, details) => writeLog('warn', category, message, details),
    error: (category, message, details) => writeLog('error', category, message, details),
    getLogPath,
    getLogContent: () => {
        try {
            const file = getLogPath();
            if (fs.existsSync(file)) {
                return fs.readFileSync(file, 'utf8');
            }
            return memoryLogs.join('\n');
        } catch (e) {
            return `Error reading log file: ${e.message}\n` + memoryLogs.join('\n');
        }
    },
    getRecentLogs: (count = 100) => {
        return memoryLogs.slice(-count);
    },
    clearLogs: () => {
        memoryLogs.length = 0;
        try {
            const file = getLogPath();
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
            initializeDebugLogger();
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },
    exportLogs: async parentWindow => {
        try {
            const file = getLogPath();
            if (!fs.existsSync(file)) {
                initializeDebugLogger();
            }
            const { filePath } = await dialog.showSaveDialog(parentWindow, {
                title: 'Export TITS Diagnostic Logs',
                defaultPath: path.join(os.homedir(), 'Desktop', `tits-debug-logs-${Date.now()}.txt`),
                filters: [{ name: 'Log Files', extensions: ['txt', 'log'] }],
            });
            if (filePath) {
                fs.copyFileSync(file, filePath);
                return { success: true, path: filePath };
            }
            return { success: false, canceled: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },
    openLogInFolder: () => {
        try {
            const file = getLogPath();
            if (fs.existsSync(file)) {
                shell.showItemInFolder(file);
                return { success: true };
            }
            return { success: false, error: 'Log file does not exist yet.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },
    copyLogsToClipboard: () => {
        try {
            const content = debugLogger.getLogContent();
            clipboard.writeText(content);
            return { success: true, length: content.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },
};

module.exports = debugLogger;
