/**
 * remoteTyping.js
 * Cross-platform text injection for the Remote Extension feature.
 * Supports two modes:
 *   'type'  – simulate keystroke-by-keystroke typing (stealthy, slow)
 *   'paste' – write text to clipboard and send Ctrl+V / Cmd+V (fast)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { clipboard } = require('electron');

const platform = os.platform();

// ─── helpers ──────────────────────────────────────────────────────────────────

function runVbs(scriptContent, fallbackPs) {
    const vbsPath = path.join(os.tmpdir(), `tits_rtype_${Date.now()}_${Math.floor(Math.random() * 99999)}.vbs`);
    try {
        fs.writeFileSync(vbsPath, scriptContent, 'utf8');
        const proc = spawn('cscript.exe', ['//nologo', vbsPath], { windowsHide: true, detached: true, stdio: 'ignore' });
        const cleanup = () => {
            try {
                if (fs.existsSync(vbsPath)) fs.unlinkSync(vbsPath);
            } catch (_) {}
        };
        proc.on('close', cleanup);
        proc.on('error', () => {
            cleanup();
            if (fallbackPs) runPowerShell(fallbackPs);
        });
        proc.unref();
        return proc;
    } catch (err) {
        try {
            if (fs.existsSync(vbsPath)) fs.unlinkSync(vbsPath);
        } catch (_) {}
        if (fallbackPs) return runPowerShell(fallbackPs);
        return null;
    }
}

function runPowerShell(psCode) {
    try {
        const b64 = Buffer.from(psCode, 'utf16le').toString('base64');
        const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64], {
            windowsHide: true,
            detached: true,
            stdio: 'ignore',
        });
        proc.unref();
        return proc;
    } catch (_) {
        return null;
    }
}

// VBS SendKeys character escaping:  { } + ^ % ~ ( ) [ ]  must be wrapped in braces.
function escapeVbsSendKeys(text) {
    return text.replace(/[{}\+\^%~()\[\]]/g, ch => `{${ch}}`);
}

// ─── paste mode ───────────────────────────────────────────────────────────────

/**
 * Writes `text` to the system clipboard then sends the OS paste shortcut.
 * A 120 ms delay is inserted before sending the shortcut so the OS clipboard
 * write can settle (important on Windows).
 */
function pasteText(text) {
    clipboard.writeText(text);

    if (platform === 'win32') {
        const vbs = [
            'WScript.Sleep 120',
            'Set w = CreateObject("WScript.Shell")',
            'w.SendKeys "^v"',
        ].join('\r\n');
        const ps = 'Start-Sleep -Milliseconds 120; (New-Object -ComObject WScript.Shell).SendKeys("^v")';
        runVbs(vbs, ps);
    } else if (platform === 'darwin') {
        const osa = `
delay 0.12
tell application "System Events"
    keystroke "v" using command down
end tell`.trim();
        const proc = spawn('osascript', ['-e', osa], { detached: true, stdio: 'ignore' });
        proc.unref();
    } else {
        // Linux – xdotool type via xclip paste
        const proc = spawn('bash', ['-c', 'sleep 0.12 && xdotool key ctrl+v'], { detached: true, stdio: 'ignore' });
        proc.unref();
    }
}

// ─── type mode ────────────────────────────────────────────────────────────────

/**
 * Simulates keyboard typing of `text` character by character.
 * `delayMs` is the per-character delay in milliseconds (default 30 ms).
 */
function typeText(text, delayMs = 30) {
    const safeDelay = Math.max(10, Math.min(500, delayMs));

    if (platform === 'win32') {
        // Build a VBS script that uses WScript.Shell.SendKeys with per-key sleeps
        const escaped = escapeVbsSendKeys(text);
        // Split into chunks ≤ 40 chars each to avoid command-line length limits
        const chunkSize = 40;
        const chunks = [];
        for (let i = 0; i < escaped.length; i += chunkSize) {
            chunks.push(escaped.slice(i, i + chunkSize));
        }
        const lines = ['Set w = CreateObject("WScript.Shell")'];
        for (const chunk of chunks) {
            // Escape double-quotes inside VBS string
            const safe = chunk.replace(/"/g, '""');
            lines.push(`w.SendKeys "${safe}"`);
            lines.push(`WScript.Sleep ${safeDelay * chunk.length}`);
        }
        const vbs = lines.join('\r\n');

        // PowerShell fallback
        const psEscaped = text.replace(/'/g, "''").replace(/[{}\+\^%~()\[\]]/g, ch => `{${ch}}`);
        const ps = `
$w = New-Object -ComObject WScript.Shell
$text = '${psEscaped}'
foreach ($ch in $text.ToCharArray()) {
    $w.SendKeys($ch)
    Start-Sleep -Milliseconds ${safeDelay}
}`.trim();
        runVbs(vbs, ps);
    } else if (platform === 'darwin') {
        // AppleScript – keystroke each character
        const safeText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const osa = `
set theText to "${safeText}"
repeat with i from 1 to length of theText
    tell application "System Events"
        keystroke (character i of theText)
    end tell
    delay ${(safeDelay / 1000).toFixed(3)}
end repeat`.trim();
        const proc = spawn('osascript', ['-e', osa], { detached: true, stdio: 'ignore' });
        proc.unref();
    } else {
        // Linux – xdotool type with delay
        const proc = spawn('xdotool', ['type', '--delay', String(safeDelay), '--', text], {
            detached: true,
            stdio: 'ignore',
        });
        proc.unref();
    }
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Inject text using the specified mode.
 * @param {string} text       The text to inject.
 * @param {'type'|'paste'} mode   Injection mode.
 * @param {number} [typeDelay=30] Per-character delay for 'type' mode (ms).
 */
function injectText(text, mode = 'paste', typeDelay = 30) {
    if (!text || typeof text !== 'string') return;
    if (mode === 'type') {
        typeText(text, typeDelay);
    } else {
        pasteText(text);
    }
}

module.exports = { injectText, pasteText, typeText };
