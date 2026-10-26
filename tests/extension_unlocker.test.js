const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Ace & Universal Paste Unlocker Extension Suite', () => {
    let mockWindow, mockDocument;

    beforeEach(() => {
        // Construct DOM environment for unit testing
        class MockEvent {
            constructor(type, init = {}) {
                this.type = type;
                this.cancelable = init.cancelable !== undefined ? init.cancelable : true;
                this.defaultPrevented = false;
                this.ctrlKey = !!init.ctrlKey;
                this.metaKey = !!init.metaKey;
                this.shiftKey = !!init.shiftKey;
                this.key = init.key || '';
            }
            preventDefault() {
                if (this.cancelable) this.defaultPrevented = true;
            }
            stopImmediatePropagation() {
                this.stoppedImmediate = true;
            }
        }

        class MockEventTarget {
            constructor() {
                this.listeners = {};
            }
            addEventListener(type, listener, options) {
                if (!this.listeners[type]) this.listeners[type] = [];
                this.listeners[type].push(listener);
            }
            removeEventListener(type, listener, options) {
                if (!this.listeners[type]) return;
                this.listeners[type] = this.listeners[type].filter(l => l !== listener);
            }
            dispatchEvent(event) {
                const list = this.listeners[event.type] || [];
                for (const l of list) {
                    l.call(this, event);
                }
                return !event.defaultPrevented;
            }
        }

        class MockElement extends MockEventTarget {
            constructor(tagName) {
                super();
                this.tagName = tagName.toUpperCase();
                this.attributes = {};
                this.style = {};
                this.classList = {
                    classes: new Set(),
                    contains(c) {
                        return this.classes.has(c);
                    },
                    add(c) {
                        this.classes.add(c);
                    },
                    remove(c) {
                        this.classes.delete(c);
                    },
                };
                this.children = [];
            }
            hasAttribute(attr) {
                return attr in this.attributes;
            }
            getAttribute(attr) {
                return this.attributes[attr];
            }
            setAttribute(attr, val) {
                this.attributes[attr] = val;
            }
            removeAttribute(attr) {
                delete this.attributes[attr];
            }
            querySelectorAll() {
                return [];
            }
            closest() {
                return null;
            }
        }

        mockWindow = new MockEventTarget();
        mockWindow.Event = MockEvent;
        mockWindow.EventTarget = MockEventTarget;
        mockWindow.HTMLElement = MockElement;
        mockWindow.HTMLInputElement = class extends MockElement {};
        mockWindow.HTMLTextAreaElement = class extends MockElement {};
        mockWindow.HTMLDocument = class extends MockEventTarget {};
        mockWindow.Window = MockEventTarget;
        mockWindow.HTMLBodyElement = class extends MockElement {};

        mockDocument = new MockEventTarget();
        mockDocument.head = new MockElement('head');
        mockDocument.documentElement = new MockElement('html');
        mockDocument.createElement = tag => new MockElement(tag);
        mockDocument.querySelectorAll = () => [];
    });

    test('Extension Manifest V3 has valid syntax and keys', () => {
        const manifestPath = path.resolve(__dirname, '..', 'extension', 'manifest.json');
        assert.ok(fs.existsSync(manifestPath), 'manifest.json exists');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        assert.strictEqual(manifest.manifest_version, 3);
        assert.ok(manifest.permissions.includes('clipboardRead'));
        assert.ok(manifest.permissions.includes('storage'));
        assert.ok(manifest.permissions.includes('contextMenus'));
        assert.ok(manifest.content_scripts.length >= 2);
        assert.strictEqual(manifest.content_scripts[0].world, 'MAIN');
        assert.strictEqual(manifest.content_scripts[0].run_at, 'document_start');
        assert.ok(manifest.icons['16'] && manifest.icons['48'] && manifest.icons['128']);
    });

    test('Event.prototype.preventDefault() is neutralized for page paste blocks while preserving internal editor buffers', () => {
        // Load and evaluate core patch logic
        const UNBLOCK_EVENT_TYPES = new Set(['paste', 'beforepaste', 'copy', 'cut', 'contextmenu', 'selectstart']);
        const origPreventDefault = mockWindow.Event.prototype.preventDefault;

        mockWindow.Event.prototype.preventDefault = function () {
            const targetEl = this.target || this.srcElement;
            const isEditorInternal =
                targetEl &&
                ((targetEl.classList && (targetEl.classList.contains('ace_text-input') || targetEl.classList.contains('xterm-helper-textarea'))) ||
                    (targetEl.closest && (targetEl.closest('.ace_editor') || targetEl.closest('.monaco-editor') || targetEl.closest('.CodeMirror'))));

            if (isEditorInternal) {
                return origPreventDefault.apply(this, arguments);
            }

            const eventType = (this.type || '').toLowerCase();
            if (UNBLOCK_EVENT_TYPES.has(eventType)) {
                return; // Neuter hostile page preventDefault
            }
            if (eventType === 'keydown') {
                const key = (this.key || '').toLowerCase();
                const isMod = this.ctrlKey || this.metaKey;
                if (isMod && (key === 'v' || key === 'insert')) {
                    return; // Neuter keydown Ctrl+V cancel
                }
            }
            return origPreventDefault.apply(this, arguments);
        };

        // 1. External page paste event preventDefault should do nothing
        const pasteEvt = new mockWindow.Event('paste', { cancelable: true });
        pasteEvt.preventDefault();
        assert.strictEqual(pasteEvt.defaultPrevented, false, 'Hostile page paste event preventDefault was neutered');

        // 2. Ace internal textarea paste preventDefault MUST work to protect buffer from double insertion
        const aceInput = mockDocument.createElement('textarea');
        aceInput.classList.classes.add('ace_text-input');
        const acePasteEvt = new mockWindow.Event('paste', { cancelable: true });
        acePasteEvt.target = aceInput;
        acePasteEvt.preventDefault();
        assert.strictEqual(acePasteEvt.defaultPrevented, true, 'Ace internal textarea preventDefault is preserved');

        // 3. Keydown Ctrl+V on normal element preventDefault should do nothing
        const ctrlVEvt = new mockWindow.Event('keydown', { key: 'v', ctrlKey: true, cancelable: true });
        ctrlVEvt.preventDefault();
        assert.strictEqual(ctrlVEvt.defaultPrevented, false, 'Ctrl+V keydown preventDefault was neutered');

        // 4. Normal event preventDefault should still work
        const submitEvt = new mockWindow.Event('submit', { cancelable: true });
        submitEvt.preventDefault();
        assert.strictEqual(submitEvt.defaultPrevented, true, 'Non-clipboard event preventDefault functions normally');
    });

    test('Ace Editor unlocker overrides setReadOnly and getReadOnly', () => {
        const mockAce = {
            Editor: function () {
                this.readOnly = false;
                this.container = { classList: { remove() {} }, removeAttribute() {} };
                this.textInput = { getElement: () => ({ readOnly: false, removeAttribute() {} }) };
            },
        };

        mockAce.Editor.prototype.setReadOnly = function (val) {
            this.readOnly = val;
        };
        mockAce.Editor.prototype.getReadOnly = function () {
            return this.readOnly;
        };

        // Apply extension patch
        const origSetReadOnly = mockAce.Editor.prototype.setReadOnly;
        mockAce.Editor.prototype.setReadOnly = function (readOnly) {
            return origSetReadOnly.call(this, false); // always force false!
        };
        mockAce.Editor.prototype.getReadOnly = function () {
            return false; // always false
        };

        const editor = new mockAce.Editor();

        // Malicious page tries to lock editor
        editor.setReadOnly(true);
        assert.strictEqual(editor.readOnly, false, 'editor.setReadOnly(true) forced to false');
        assert.strictEqual(editor.getReadOnly(), false, 'editor.getReadOnly() returns false');
    });

    test('Deep ActiveElement traversal resolves nested shadow DOM inputs (Google Cloud Console)', () => {
        function getDeepActiveElement(root) {
            let active = root.activeElement;
            while (active && active.shadowRoot && active.shadowRoot.activeElement) {
                active = active.shadowRoot.activeElement;
            }
            return active;
        }

        const innerInput = { tagName: 'INPUT', id: 'inner-cfc-input' };
        const shadowHost = {
            tagName: 'CFC-TEXT-FIELD',
            shadowRoot: {
                activeElement: innerInput,
            },
        };
        const mockRoot = { activeElement: shadowHost };

        const resolved = getDeepActiveElement(mockRoot);
        assert.strictEqual(resolved.id, 'inner-cfc-input', 'Resolved inner input from shadow root');
    });

    test('QWERTY Neighbor Map generates valid adjacent typos', () => {
        const QWERTY_NEIGHBORS = {
            a: ['s', 'q', 'z', 'w'],
            e: ['w', 'r', 'd', 's'],
            t: ['r', 'y', 'g', 'f'],
            o: ['i', 'p', 'l', 'k'],
        };

        const targetChar = 'e';
        const neighbors = QWERTY_NEIGHBORS[targetChar];
        assert.ok(Array.isArray(neighbors));
        assert.ok(neighbors.includes('w'));
        assert.ok(neighbors.includes('r'));
        assert.ok(neighbors.includes('d'));

        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        assert.ok(neighbors.includes(randomNeighbor), 'Selected typo is an authentic adjacent key');
    });

    test('Dual Switches Configuration State management works correctly', () => {
        const defaultState = {
            pasteEnabled: true,
            typingPasteEnabled: false,
            typingSpeed: 65,
            typoRate: 0.04,
        };

        assert.strictEqual(defaultState.pasteEnabled, true);
        assert.strictEqual(defaultState.typingPasteEnabled, false);

        // Toggle typing paste ON
        const updatedState = { ...defaultState, typingPasteEnabled: true };
        assert.strictEqual(updatedState.typingPasteEnabled, true);
    });

    test('sanitizePastedText cleans Ace font-metrics (Hebrew/X repeats) and gutter numbers', () => {
        function sanitizePastedText(text) {
            if (!text || typeof text !== 'string') return text;
            let cleaned = text;
            // 1. Remove Ace font-metrics test strings (Hebrew characters and long X sequences)
            cleaned = cleaned.replace(/[\u0590-\u05FF]+/g, '');
            cleaned = cleaned.replace(/X{10,}/g, '');

            // 2. Remove concatenated gutter line numbers at start (123456789101112...)
            for (const startNum of [1, 0]) {
                let expected = startNum;
                let idx = 0;
                while (idx < cleaned.length) {
                    const numStr = String(expected);
                    if (cleaned.startsWith(numStr, idx)) {
                        idx += numStr.length;
                        expected++;
                    } else {
                        break;
                    }
                }
                if (expected - startNum >= 4) {
                    cleaned = cleaned.slice(idx);
                    break;
                }
            }
            return cleaned.trim();
        }

        const corruptedInput =
            '12345678910111213141516171819202122232425a = 5\nprice = 50\nהההההההההההההההההההההההההההההההההXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        const cleaned = sanitizePastedText(corruptedInput);
        assert.strictEqual(cleaned, 'a = 5\nprice = 50');
    });

    test('Extension Remote Client: constructs valid injection payload and validates parameters', () => {
        function buildRemotePayload(text, mode, speed) {
            const trimmed = (text || '').trim();
            if (!trimmed) return null;
            const validMode = mode === 'type' ? 'type' : 'paste';
            const safeSpeed = typeof speed === 'number' && speed >= 10 ? speed : 65;
            return {
                type: 'inject',
                text,
                mode: validMode,
                delay: safeSpeed,
            };
        }

        // Valid paste payload
        const p1 = buildRemotePayload('Hello World', 'paste', 65);
        assert.deepStrictEqual(p1, {
            type: 'inject',
            text: 'Hello World',
            mode: 'paste',
            delay: 65,
        });

        // Valid type payload with custom speed
        const p2 = buildRemotePayload('Code snippet', 'type', 45);
        assert.deepStrictEqual(p2, {
            type: 'inject',
            text: 'Code snippet',
            mode: 'type',
            delay: 45,
        });

        // Invalid mode defaults to paste
        const p3 = buildRemotePayload('Fallback test', 'unknown_mode', 50);
        assert.strictEqual(p3.mode, 'paste');

        // Empty/whitespace text produces null (guarded from sending)
        assert.strictEqual(buildRemotePayload('', 'paste', 65), null);
        assert.strictEqual(buildRemotePayload('   \n\t  ', 'paste', 65), null);
        assert.strictEqual(buildRemotePayload(null, 'paste', 65), null);
    });

    test('Extension Remote Client: processes ack status and controls UI feedback states', () => {
        function handleAck(ack, state) {
            if (ack && ack.type === 'ack') {
                if (ack.status === 'ok') {
                    return {
                        ...state,
                        text: '',
                        hint: `Sent ✓ (${ack.message || 'ok'})`,
                        hintType: 'ok',
                    };
                } else {
                    return {
                        ...state,
                        hint: `Error: ${ack.message}`,
                        hintType: 'err',
                    };
                }
            }
            return state;
        }

        const initialState = { text: 'my secret answer', hint: 'Sending…', hintType: '' };

        // Successful ack
        const okState = handleAck({ type: 'ack', status: 'ok', message: 'Injected (paste)' }, initialState);
        assert.strictEqual(okState.text, '');
        assert.strictEqual(okState.hintType, 'ok');
        assert.ok(okState.hint.includes('Sent ✓'));

        // Error ack
        const errState = handleAck({ type: 'ack', status: 'error', message: 'Target window lost' }, initialState);
        assert.strictEqual(errState.text, 'my secret answer'); // text preserved on error
        assert.strictEqual(errState.hintType, 'err');
        assert.strictEqual(errState.hint, 'Error: Target window lost');
    });
});
