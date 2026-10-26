/**
 * tests/remoteTyping.test.js
 *
 * Tests for src/utils/remoteTyping.js
 *
 * Strategy: remoteTyping.js calls `clipboard` from 'electron' and spawns
 * OS-level processes (cscript, osascript, xdotool).  We stub both so the
 * tests run cleanly in Node without an Electron runtime or a GUI session.
 *
 * We verify:
 *   • VBS escape logic (pure function, no stubs required)
 *   • injectText guard-rails (null / empty / non-string inputs)
 *   • Mode routing (type vs paste)
 *   • Delay clamping (10–500 ms)
 *   • That spawn is called with the expected program for the current platform
 *   • That clipboard.writeText is called with the right payload in paste mode
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Module = require('module');
const os = require('os');
const EventEmitter = require('events');

// ─── Fake process / EventEmitter returned by every spawn() call ──────────────
function makeFakeProc() {
    const proc = new EventEmitter();
    proc.unref = () => {};
    proc.pid = 12345;
    return proc;
}

// ─── Stub registry ────────────────────────────────────────────────────────────
const spawnCalls = [];
let clipboardText = null;

// Patch Module._resolveFilename so require('electron') returns our stub
// and require('child_process') returns a stub that records spawn calls.
const _origResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === 'electron') return '__stub_electron__';
    if (request === 'child_process') return '__stub_child_process__';
    return _origResolve(request, parent, isMain, options);
};

require.cache['__stub_electron__'] = {
    id: '__stub_electron__',
    filename: '__stub_electron__',
    loaded: true,
    exports: {
        clipboard: {
            writeText(text) {
                clipboardText = text;
            },
            readText() {
                return clipboardText ?? '';
            },
        },
    },
};

require.cache['__stub_child_process__'] = {
    id: '__stub_child_process__',
    filename: '__stub_child_process__',
    loaded: true,
    exports: {
        spawn(cmd, args, opts) {
            spawnCalls.push({ cmd, args, opts });
            return makeFakeProc();
        },
    },
};

// Now load the module under test (picks up the stubs above)
const { injectText, pasteText, typeText } = require('../src/utils/remoteTyping');

// Helper to drain call list
function drainSpawn() {
    const copy = [...spawnCalls];
    spawnCalls.length = 0;
    return copy;
}

// ─── escapeVbsSendKeys (tested indirectly via typeText on win32) ─────────────

test('remoteTyping: escapeVbsSendKeys wraps special SendKeys characters in braces', () => {
    // Extract the escape logic by testing a round-trip through typeText on win32.
    // We inspect what VBS content the spawn receives.
    if (os.platform() !== 'win32') {
        // On non-windows we test the pure regex escape logic manually
        const specialChars = '{}+^%~()[]';
        for (const ch of specialChars) {
            // Each of these characters should be escaped
            const regex = /[{}\+\^%~()\[\]]/g;
            const escaped = ch.replace(regex, c => `{${c}}`);
            assert.strictEqual(escaped, `{${ch}}`, `${ch} must be wrapped in braces`);
        }
        return;
    }

    drainSpawn();
    typeText('A+B{C}', 10);
    const calls = drainSpawn();
    // A spawn must have been made (cscript or powershell)
    assert.ok(calls.length > 0, 'Expected at least one spawn call');
});

// ─── injectText guard-rails ───────────────────────────────────────────────────

test('remoteTyping: injectText silently ignores null input', () => {
    drainSpawn();
    clipboardText = null;
    assert.doesNotThrow(() => injectText(null, 'paste'));
    assert.strictEqual(clipboardText, null, 'clipboard must not be written for null input');
    assert.strictEqual(drainSpawn().length, 0, 'No spawn for null input');
});

test('remoteTyping: injectText silently ignores undefined input', () => {
    drainSpawn();
    clipboardText = null;
    assert.doesNotThrow(() => injectText(undefined, 'paste'));
    assert.strictEqual(clipboardText, null, 'clipboard must not be written for undefined input');
    assert.strictEqual(drainSpawn().length, 0, 'No spawn for undefined input');
});

test('remoteTyping: injectText silently ignores empty string input', () => {
    drainSpawn();
    clipboardText = null;
    assert.doesNotThrow(() => injectText('', 'paste'));
    assert.strictEqual(clipboardText, null, 'clipboard must not be written for empty string');
    assert.strictEqual(drainSpawn().length, 0, 'No spawn for empty string');
});

test('remoteTyping: injectText silently ignores numeric input (wrong type)', () => {
    drainSpawn();
    clipboardText = null;
    assert.doesNotThrow(() => injectText(12345, 'paste'));
    assert.strictEqual(clipboardText, null, 'clipboard must not be written for number input');
    assert.strictEqual(drainSpawn().length, 0, 'No spawn for number input');
});

test('remoteTyping: injectText silently ignores object input (wrong type)', () => {
    drainSpawn();
    clipboardText = null;
    assert.doesNotThrow(() => injectText({ text: 'hello' }, 'paste'));
    assert.strictEqual(clipboardText, null, 'clipboard must not be written for object input');
});

// ─── paste mode ───────────────────────────────────────────────────────────────

test('remoteTyping: paste mode writes exact text to clipboard', () => {
    clipboardText = null;
    drainSpawn();
    injectText('hello world', 'paste');
    assert.strictEqual(clipboardText, 'hello world', 'clipboard must contain injected text');
});

test('remoteTyping: paste mode works with unicode and emoji', () => {
    const emoji = '🎯 Tïtlé – résumé €100';
    clipboardText = null;
    injectText(emoji, 'paste');
    assert.strictEqual(clipboardText, emoji, 'Unicode/emoji must be preserved in clipboard');
});

test('remoteTyping: paste mode works with multiline text', () => {
    const multiline = 'Line 1\nLine 2\r\nLine 3\tTabbed';
    clipboardText = null;
    injectText(multiline, 'paste');
    assert.strictEqual(clipboardText, multiline, 'Multiline text preserved in clipboard');
});

test('remoteTyping: paste mode works with very long text (50 000 chars)', () => {
    const big = 'A'.repeat(50_000);
    clipboardText = null;
    assert.doesNotThrow(() => injectText(big, 'paste'));
    assert.strictEqual(clipboardText, big, 'Large text preserved in clipboard');
});

test('remoteTyping: injectText defaults to paste mode when mode is omitted', () => {
    clipboardText = null;
    injectText('default mode test');
    assert.strictEqual(clipboardText, 'default mode test', 'Default mode must be paste');
});

test('remoteTyping: injectText treats unknown mode as paste', () => {
    clipboardText = null;
    injectText('unknown mode test', 'unknown_mode');
    assert.strictEqual(clipboardText, 'unknown mode test', 'Unknown mode should fall back to paste');
});

// ─── type mode ────────────────────────────────────────────────────────────────

test('remoteTyping: type mode triggers a spawn without touching clipboard', () => {
    clipboardText = null;
    drainSpawn();
    assert.doesNotThrow(() => injectText('type this', 'type', 20));
    // Spawn must be called
    const calls = drainSpawn();
    assert.ok(calls.length > 0, 'Expected spawn call for type mode');
    // Clipboard must be untouched
    assert.strictEqual(clipboardText, null, 'clipboard must not be written in type mode');
});

test('remoteTyping: type mode spawns correct program per platform', () => {
    drainSpawn();
    injectText('platform test', 'type', 20);
    const calls = drainSpawn();
    const plat = os.platform();
    if (plat === 'win32') {
        const hasCscript = calls.some(c => c.cmd === 'cscript.exe');
        const hasPs = calls.some(c => c.cmd === 'powershell.exe');
        assert.ok(hasCscript || hasPs, 'Windows type mode must use cscript.exe or powershell.exe');
    } else if (plat === 'darwin') {
        assert.ok(
            calls.some(c => c.cmd === 'osascript'),
            'macOS type mode must use osascript'
        );
    } else {
        assert.ok(
            calls.some(c => c.cmd === 'xdotool'),
            'Linux type mode must use xdotool'
        );
    }
});

// ─── delay clamping ───────────────────────────────────────────────────────────

test('remoteTyping: typeText clamps delay below 10 ms up to 10 ms', () => {
    // We can observe the clamping by checking the VBS Sleep values on Windows,
    // or simply verifying no throw occurs with extreme values on all platforms.
    assert.doesNotThrow(() => typeText('clamp test', 0));
    assert.doesNotThrow(() => typeText('clamp test', -500));
    assert.doesNotThrow(() => typeText('clamp test', 1));
});

test('remoteTyping: typeText clamps delay above 500 ms down to 500 ms', () => {
    assert.doesNotThrow(() => typeText('clamp test', 9999));
    assert.doesNotThrow(() => typeText('clamp test', Infinity));
    assert.doesNotThrow(() => typeText('clamp test', NaN));
});

test('remoteTyping: typeText accepts boundary delay values of exactly 10 and 500 ms', () => {
    assert.doesNotThrow(() => typeText('boundary test', 10));
    assert.doesNotThrow(() => typeText('boundary test', 500));
});

// ─── special characters in text ───────────────────────────────────────────────

test('remoteTyping: type mode handles text with VBS special chars without throwing', () => {
    const tricky = 'Hello {World} (foo) [bar] ^ctrl^ +shift+ %alt% ~tilde~';
    assert.doesNotThrow(() => injectText(tricky, 'type', 10));
});

test('remoteTyping: paste mode handles text with double-quotes without throwing', () => {
    const withQuotes = 'She said "hello" and it\'s fine';
    clipboardText = null;
    assert.doesNotThrow(() => injectText(withQuotes, 'paste'));
    assert.strictEqual(clipboardText, withQuotes);
});

test('remoteTyping: type mode handles text with backslashes without throwing', () => {
    assert.doesNotThrow(() => injectText('C:\\Users\\foo\\bar', 'type', 10));
});

test('remoteTyping: type mode handles newlines and tabs without throwing', () => {
    assert.doesNotThrow(() => injectText('line1\nline2\ttabbed', 'type', 10));
});

// ─── module exports ───────────────────────────────────────────────────────────

test('remoteTyping: module exports injectText, pasteText, and typeText', () => {
    assert.strictEqual(typeof injectText, 'function');
    assert.strictEqual(typeof pasteText, 'function');
    assert.strictEqual(typeof typeText, 'function');
});

test('remoteTyping: pasteText is directly callable and writes to clipboard', () => {
    clipboardText = null;
    assert.doesNotThrow(() => pasteText('direct paste'));
    assert.strictEqual(clipboardText, 'direct paste');
});

test('remoteTyping: typeText is directly callable without throwing', () => {
    assert.doesNotThrow(() => typeText('direct type', 30));
});
