const { spawn } = require('child_process');

let mouseProc = null;
let onHoldTriggerCallback = null;

/**
 * Start monitoring click-and-hold (5s or custom duration)
 * @param {number} durationSeconds - Duration in seconds (e.g. 3 or 5)
 * @param {Function} onTrigger - Callback when hold condition met
 */
function startClickHoldMonitor(durationSeconds = 5, onTrigger) {
    stopClickHoldMonitor();
    onHoldTriggerCallback = onTrigger;

    if (process.platform !== 'win32') {
        console.log('[MouseTrigger] Click-and-hold native hook is Windows-only; skipping on other platforms');
        return;
    }

    const thresholdMs = Math.round((durationSeconds || 5) * 1000);
    const psScript = `
$ErrorActionPreference = 'SilentlyContinue';
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinMouse {
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; }
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
}
"@;
$heldStart = 0;
$startX = 0;
$startY = 0;
$thresholdMs = ${thresholdMs};
while($true) {
    Start-Sleep -Milliseconds 100;
    $down = ([WinMouse]::GetAsyncKeyState(1) -band 0x8000) -ne 0;
    $pt = New-Object WinMouse+POINT;
    [WinMouse]::GetCursorPos([ref]$pt) | Out-Null;
    if ($down) {
        if ($heldStart -eq 0) {
            $heldStart = [Environment]::TickCount;
            $startX = $pt.X;
            $startY = $pt.Y;
        } else {
            $diff = [Environment]::TickCount - $heldStart;
            $dist = [Math]::Sqrt([Math]::Pow($pt.X - $startX, 2) + [Math]::Pow($pt.Y - $startY, 2));
            if ($dist -gt 45) {
                $heldStart = [Environment]::TickCount;
                $startX = $pt.X;
                $startY = $pt.Y;
            } elseif ($diff -ge $thresholdMs) {
                [Console]::WriteLine("CLICK_HOLD_TRIGGERED");
                $heldStart = 0;
                while(([WinMouse]::GetAsyncKeyState(1) -band 0x8000) -ne 0) {
                    Start-Sleep -Milliseconds 150;
                }
            }
        }
    } else {
        $heldStart = 0;
    }
}
`.trim();

    try {
        mouseProc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
            stdio: ['ignore', 'pipe', 'ignore'],
            windowsHide: true,
        });

        mouseProc.stdout.on('data', data => {
            const str = data.toString().trim();
            if (str.includes('CLICK_HOLD_TRIGGERED')) {
                console.log('[MouseTrigger] Click-and-hold threshold reached! Firing trigger.');
                if (onHoldTriggerCallback) {
                    onHoldTriggerCallback();
                }
            }
        });

        mouseProc.on('error', err => {
            console.warn('[MouseTrigger] Error in PowerShell monitor process:', err.message);
        });

        mouseProc.on('exit', () => {
            mouseProc = null;
        });

        console.log(`[MouseTrigger] Started click-and-hold monitor (${durationSeconds}s)`);
    } catch (err) {
        console.error('[MouseTrigger] Error starting click-hold monitor:', err);
    }
}

function stopClickHoldMonitor() {
    if (mouseProc) {
        try {
            mouseProc.kill();
        } catch (e) {}
        mouseProc = null;
        console.log('[MouseTrigger] Stopped click-and-hold monitor');
    }
}

module.exports = {
    startClickHoldMonitor,
    stopClickHoldMonitor,
};
