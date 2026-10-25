const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

let activeProcess = null;

/**
 * Maps option letter (A-Z) to integer count (1-26).
 */
function letterToCount(letter) {
    if (!letter || typeof letter !== 'string') return 0;
    const clean = letter.trim().toUpperCase();
    if (clean.length === 0) return 0;
    const code = clean.charCodeAt(0);
    if (code >= 65 && code <= 90) {
        return code - 64;
    }
    const digit = parseInt(clean, 10);
    if (!isNaN(digit) && digit >= 1 && digit <= 9) {
        return digit;
    }
    return 1;
}

/**
 * Pulses CapsLock LED indicator `count` times.
 * Each cycle turns the LED on, waits intervalMs, turns it off, and waits intervalMs.
 * Total toggles per cycle is 2, ensuring initial keyboard state is completely preserved!
 *
 * @param {number} count - Number of blinks (e.g. 1 for A, 2 for B, 3 for C, 4 for D)
 * @param {number} intervalMs - Blink duration in milliseconds (default 200ms)
 */
function pulseCapsLock(count = 1, intervalMs = 200) {
    const blinkCount = Math.max(1, Math.min(count || 1, 10)); // Clamp 1..10
    const interval = Math.max(80, Math.min(intervalMs || 200, 1000));
    const platform = os.platform();

    try {
        if (platform === 'win32') {
            // Windows: Execute via background PowerShell SendKeys loop
            const psScript = `
$w = New-Object -ComObject Wscript.Shell
1..${blinkCount} | ForEach-Object {
    $w.SendKeys('{CAPSLOCK}')
    Start-Sleep -Milliseconds ${interval}
    $w.SendKeys('{CAPSLOCK}')
    Start-Sleep -Milliseconds ${interval}
}
`.trim();

            const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
                windowsHide: true,
                detached: true,
                stdio: 'ignore',
            });
            proc.unref();
            activeProcess = proc;
        } else if (platform === 'darwin') {
            // macOS: Keycode 57 is CapsLock in AppleScript System Events
            const osaScript = `
repeat ${blinkCount} times
    tell application "System Events" to key code 57
    delay ${interval / 1000}
    tell application "System Events" to key code 57
    delay ${interval / 1000}
end repeat
`.trim();

            const proc = spawn('osascript', ['-e', osaScript], {
                detached: true,
                stdio: 'ignore',
            });
            proc.unref();
            activeProcess = proc;
        } else if (platform === 'linux') {
            // Linux: xdotool key Caps_Lock
            const bashScript = `
for i in $(seq 1 ${blinkCount}); do
    xdotool key Caps_Lock 2>/dev/null || true
    sleep ${(interval / 1000).toFixed(2)}
    xdotool key Caps_Lock 2>/dev/null || true
    sleep ${(interval / 1000).toFixed(2)}
done
`.trim();

            const proc = spawn('bash', ['-c', bashScript], {
                detached: true,
                stdio: 'ignore',
            });
            proc.unref();
            activeProcess = proc;
        }
    } catch (err) {
        console.warn('[CapsLock] Failed to pulse CapsLock LED:', err.message);
    }
}

/**
 * Single toggle of Caps Lock LED.
 */
function toggleCapsLock() {
    const platform = os.platform();
    try {
        if (platform === 'win32') {
            const proc = spawn(
                'powershell.exe',
                ['-NoProfile', '-NonInteractive', '-Command', "(New-Object -ComObject Wscript.Shell).SendKeys('{CAPSLOCK}')"],
                {
                    windowsHide: true,
                    detached: true,
                    stdio: 'ignore',
                }
            );
            proc.unref();
        } else if (platform === 'darwin') {
            const proc = spawn('osascript', ['-e', 'tell application "System Events" to key code 57'], {
                detached: true,
                stdio: 'ignore',
            });
            proc.unref();
        } else if (platform === 'linux') {
            const proc = spawn('xdotool', ['key', 'Caps_Lock'], {
                detached: true,
                stdio: 'ignore',
            });
            proc.unref();
        }
    } catch (err) {
        console.warn('[CapsLock] Failed to toggle CapsLock:', err.message);
    }
}

/**
 * Triggers the CapsLock indicator for an answered question according to preference mode.
 *
 * @param {string} letter - Option letter (A, B, C, D, etc.)
 * @param {string} mode - 'pulse' (A=1, B=2, C=3, D=4) or 'toggle' (single toggle)
 */
function triggerCapsLockAnswer(letter, mode = 'pulse') {
    if (!letter) return;
    if (mode === 'toggle') {
        toggleCapsLock();
    } else {
        const count = letterToCount(letter);
        if (count > 0) {
            pulseCapsLock(count, 200);
        }
    }
}

module.exports = {
    letterToCount,
    pulseCapsLock,
    toggleCapsLock,
    triggerCapsLockAnswer,
};
