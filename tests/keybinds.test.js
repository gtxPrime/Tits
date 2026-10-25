const test = require('node:test');
const assert = require('node:assert');

function normalizeKeybind(keybind, isMac = false) {
    if (!keybind || typeof keybind !== 'string') return '';
    const parts = keybind.split('+').map(p => p.trim());
    const modifiers = [];
    let mainKey = '';

    for (const part of parts) {
        const lower = part.toLowerCase();
        if (lower === 'ctrl' || lower === 'control') {
            modifiers.push(isMac ? 'CommandOrControl' : 'Ctrl');
        } else if (lower === 'cmd' || lower === 'command') {
            modifiers.push(isMac ? 'Cmd' : 'Ctrl');
        } else if (lower === 'alt' || lower === 'option') {
            modifiers.push('Alt');
        } else if (lower === 'shift') {
            modifiers.push('Shift');
        } else {
            mainKey = part.toUpperCase();
        }
    }

    return [...modifiers, mainKey].join('+');
}

test('keybinds: normalizes shortcut strings correctly across OS platforms', () => {
    const winShortcut = normalizeKeybind('ctrl+alt+q', false);
    assert.strictEqual(winShortcut, 'Ctrl+Alt+Q');

    const macShortcut = normalizeKeybind('cmd+alt+q', true);
    assert.strictEqual(macShortcut, 'Cmd+Alt+Q');
});

test('keybinds: handles extra whitespace and lowercase input', () => {
    const cleaned = normalizeKeybind('  ctrl +   shift +  enter  ', false);
    assert.strictEqual(cleaned, 'Ctrl+Shift+ENTER');
});

test('keybinds: returns empty string on null or undefined input', () => {
    assert.strictEqual(normalizeKeybind(null), '');
    assert.strictEqual(normalizeKeybind(undefined), '');
    assert.strictEqual(normalizeKeybind(123), '');
});

test('keybinds: detects potential keybinding conflicts', () => {
    const keybinds = {
        solveExam: 'Ctrl+Alt+Q',
        toggleVisibility: 'Ctrl+\\',
        duplicateAction: 'Ctrl+Alt+Q',
    };

    const reverseMap = {};
    const conflicts = [];

    for (const [action, shortcut] of Object.entries(keybinds)) {
        if (reverseMap[shortcut]) {
            conflicts.push({ shortcut, actions: [reverseMap[shortcut], action] });
        } else {
            reverseMap[shortcut] = action;
        }
    }

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].shortcut, 'Ctrl+Alt+Q');
    assert.deepStrictEqual(conflicts[0].actions, ['solveExam', 'duplicateAction']);
});
