/**
 * TITS - Paste & Editor Unlocker (Main World Script)
 * Runs directly in the webpage execution context (MAIN world) at document-start.
 *
 * Designed to work seamlessly on:
 *  - Ace Editor (prevents gutter and font-metrics corruption)
 *  - Monaco Editor / VS Code Web / Cloud Workstations
 *  - Google Cloud Console (Deep Shadow DOM) & Google Cloud Shell (xterm.js)
 *  - CodeMirror, CKEditor, Quill, TinyMCE & Standard HTML inputs
 */

(function () {
    'use strict';

    if (window.__TITS_UNLOCKER_ACTIVE__) return;
    window.__TITS_UNLOCKER_ACTIVE__ = true;

    // Active configuration
    const config = {
        pasteEnabled: true,
        typingPasteEnabled: false,
        typingSpeed: 65, // average ms per keystroke
        typoRate: 0.04, // 4% typo chance
    };

    const stats = {
        aceEditorsUnlocked: 0,
        monacoEditorsUnlocked: 0,
        codeMirrorEditorsUnlocked: 0,
        pasteBlocksNeutralized: 0,
        contextMenuBlocksNeutralized: 0,
        humanTypingActive: false,
    };

    function reportStats() {
        window.postMessage(
            {
                source: 'TITS_UNLOCKER_MAIN',
                type: 'STATS_UPDATE',
                stats: stats,
            },
            '*'
        );
    }

    /* ==========================================================================
     TEXT CLEANER / SANITIZER
     Prevents the infamous Ace Editor "12345...הההה...XXXX" corruption issue
     ========================================================================== */

    function sanitizePastedText(text) {
        // Clipboard text is user data. Do not strip Hebrew, repeated letters,
        // numeric prefixes, indentation, or other valid source content.
        return typeof text === 'string' ? text.replace(/\r\n?/g, '\n') : '';
    }

    /* ==========================================================================
     KEYBOARD LAYOUT (QWERTY NEIGHBORS FOR NATURAL HUMAN TYPOS)
     ========================================================================== */

    const QWERTY_NEIGHBORS = {
        a: ['s', 'q', 'z', 'w'],
        b: ['v', 'g', 'h', 'n'],
        c: ['x', 'd', 'f', 'v'],
        d: ['e', 'r', 's', 'f', 'x', 'c'],
        e: ['w', 'r', 'd', 's'],
        f: ['r', 't', 'g', 'v', 'c', 'd'],
        g: ['t', 'y', 'h', 'b', 'v', 'f'],
        h: ['y', 'u', 'j', 'n', 'b', 'g'],
        i: ['u', 'o', 'k', 'j'],
        j: ['u', 'i', 'k', 'm', 'n', 'h'],
        k: ['i', 'o', 'l', 'j', 'm'],
        l: ['o', 'p', 'k'],
        m: ['n', 'j', 'k'],
        n: ['b', 'h', 'j', 'm'],
        o: ['i', 'p', 'l', 'k'],
        p: ['o', 'l'],
        q: ['w', 'a'],
        r: ['e', 't', 'f', 'd'],
        s: ['a', 'w', 'e', 'd', 'x', 'z'],
        t: ['r', 'y', 'g', 'f'],
        u: ['y', 'i', 'h', 'j'],
        v: ['c', 'f', 'g', 'b'],
        w: ['q', 'e', 's', 'a'],
        x: ['z', 's', 'd', 'c'],
        y: ['t', 'u', 'h', 'g'],
        z: ['a', 's', 'x'],
        A: ['S', 'Q', 'Z', 'W'],
        B: ['V', 'G', 'H', 'N'],
        C: ['X', 'D', 'F', 'V'],
        D: ['E', 'R', 'S', 'F', 'X', 'C'],
        E: ['W', 'R', 'D', 'S'],
        F: ['R', 'T', 'G', 'V', 'C', 'D'],
        G: ['T', 'Y', 'H', 'B', 'V', 'F'],
        H: ['Y', 'U', 'J', 'N', 'B', 'G'],
        I: ['U', 'O', 'K', 'J'],
        J: ['U', 'I', 'K', 'M', 'N', 'H'],
        K: ['I', 'O', 'L', 'J', 'M'],
        L: ['O', 'P', 'K'],
        M: ['N', 'J', 'K'],
        N: ['B', 'H', 'J', 'M'],
        O: ['I', 'P', 'L', 'K'],
        P: ['O', 'L'],
        Q: ['W', 'A'],
        R: ['E', 'T', 'F', 'D'],
        S: ['A', 'W', 'E', 'D', 'X', 'Z'],
        T: ['R', 'Y', 'G', 'F'],
        U: ['Y', 'I', 'H', 'J'],
        V: ['C', 'F', 'G', 'B'],
        W: ['Q', 'E', 'S', 'A'],
        X: ['Z', 'S', 'D', 'C'],
        Y: ['T', 'U', 'H', 'G'],
        Z: ['A', 'S', 'X'],
        1: ['2', 'q'],
        2: ['1', '3', 'w', 'q'],
        3: ['2', '4', 'e', 'w'],
        4: ['3', '5', 'r', 'e'],
        5: ['4', '6', 't', 'r'],
        6: ['5', '7', 'y', 't'],
        7: ['6', '8', 'u', 'y'],
        8: ['7', '9', 'i', 'u'],
        9: ['8', '0', 'o', 'i'],
        0: ['9', 'p', 'o'],
    };

    /* ==========================================================================
     DEEP TARGET DISCOVERY (Supports Google Cloud Console Shadow DOM & Terminals)
     ========================================================================== */

    let lastUserFocusedElement = null;

    document.addEventListener(
        'focusin',
        function (e) {
            const target = e.target;
            if (target && target !== document.body && target !== document.documentElement) {
                lastUserFocusedElement = target;
            }
        },
        true
    );

    function getDeepActiveElement(root = document) {
        let active = root.activeElement;
        while (active && active.shadowRoot && active.shadowRoot.activeElement) {
            active = active.shadowRoot.activeElement;
        }
        return active;
    }

    function getTargetEditorOrElement() {
        let active = getDeepActiveElement() || document.activeElement;

        // If window blurred when user switched to sender browser, restore last focused element!
        if ((!active || active === document.body || active === document.documentElement) && lastUserFocusedElement) {
            if (document.contains(lastUserFocusedElement)) {
                active = lastUserFocusedElement;
            }
        }

        // 1. Google Cloud Shell / Xterm.js Terminal Check
        if (active) {
            const xtermWrapper = active.closest('.xterm, [class*="terminal"]');
            if (xtermWrapper) {
                const helper = xtermWrapper.querySelector('.xterm-helper-textarea') || active;
                return { type: 'xterm', element: helper };
            }
            if (active.classList && active.classList.contains('xterm-helper-textarea')) {
                return { type: 'xterm', element: active };
            }
        }

        // 2. TinyMCE Editor Check (used by OnlineNotepad, WordPress, rich-text platforms)
        if (window.tinymce && window.tinymce.editors && window.tinymce.editors.length > 0) {
            const ed = window.tinymce.activeEditor || window.tinymce.editors[0];
            if (ed) {
                return { type: 'tinymce', editor: ed };
            }
        }

        // 3. Ace Editor Check
        let aceNode = active && active !== document.body ? (active.closest ? active.closest('.ace_editor') : null) : null;
        if (!aceNode) aceNode = document.querySelector('.ace_editor');
        if (aceNode) {
            if (aceNode.env && aceNode.env.editor) return { type: 'ace', editor: aceNode.env.editor };
            if (aceNode.aceEditor) return { type: 'ace', editor: aceNode.aceEditor };
        }

        // 3. Monaco Editor Check (VS Code Web, Cloud Workstations, LeetCode)
        if (window.monaco && window.monaco.editor && typeof window.monaco.editor.getEditors === 'function') {
            const editors = window.monaco.editor.getEditors();
            for (const ed of editors) {
                if (ed.hasTextFocus && ed.hasTextFocus()) {
                    return { type: 'monaco', editor: ed };
                }
            }
            if (editors.length === 1) {
                return { type: 'monaco', editor: editors[0] };
            }
        }

        // 4. CodeMirror Check
        let cmNode = active && active !== document.body ? (active.closest ? active.closest('.CodeMirror') : null) : null;
        if (!cmNode) cmNode = document.querySelector('.CodeMirror');
        if (cmNode && cmNode.CodeMirror) {
            return { type: 'codemirror', editor: cmNode.CodeMirror };
        }

        // 5. Standard Input / Textarea / ContentEditable
        if (active && active !== document.body && active !== document.documentElement) {
            if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) {
                return { type: 'dom', element: active };
            }
        }

        // 6. If active element is an IFRAME, drill into its contentDocument
        if (active && active.tagName === 'IFRAME') {
            try {
                const doc = active.contentDocument || (active.contentWindow && active.contentWindow.document);
                if (doc && doc.body) {
                    const inner = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : doc.body;
                    return { type: 'dom', element: inner };
                }
            } catch (_) {}
        }

        // 7. Check iframes with editable documents (e.g. OnlineNotepad #editor_ifr)
        const iframes = document.querySelectorAll('iframe');
        for (const ifr of iframes) {
            try {
                const doc = ifr.contentDocument || (ifr.contentWindow && ifr.contentWindow.document);
                if (
                    doc &&
                    doc.body &&
                    (doc.body.isContentEditable ||
                        doc.designMode === 'on' ||
                        doc.body.id === 'tinymce' ||
                        doc.body.classList.contains('mce-content-body'))
                ) {
                    const inner = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : doc.body;
                    return { type: 'dom', element: inner };
                }
            } catch (_) {}
        }

        // 6. Automatic input discovery: Find visible text box, textarea, or contenteditable on page
        const candidates = document.querySelectorAll(
            'textarea:not([disabled]):not([readonly]), input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly]), [contenteditable="true"]:not([contenteditable="false"]), [role="textbox"], .ql-editor, .ProseMirror'
        );
        for (const cand of candidates) {
            const rect = cand.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                try {
                    cand.focus();
                } catch (_) {}
                return { type: 'dom', element: cand };
            }
        }

        return { type: 'dom', element: active || document.body };
    }

    /* ==========================================================================
     HUMAN TYPING ENGINE WITH TYPOS & BACKSPACES
     ========================================================================== */

    let currentTypingSession = null;

    function showTypingIndicator() {
        stats.humanTypingActive = true;
        reportStats();
    }

    function hideTypingIndicator() {
        stats.humanTypingActive = false;
        reportStats();
    }

    function stopHumanTyping() {
        if (currentTypingSession) {
            currentTypingSession.cancelled = true;
            currentTypingSession = null;
        }
        hideTypingIndicator();
    }

    // Cancel typing on Escape
    window.addEventListener(
        'keydown',
        e => {
            if (e.key === 'Escape' && currentTypingSession) {
                stopHumanTyping();
            }
        },
        true
    );

    function dispatchAuthenticKeystroke(el, ch) {
        const keyCode = ch.charCodeAt(0);

        try {
            el.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: ch,
                    code: `Key${ch.toUpperCase()}`,
                    keyCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true,
                })
            );
        } catch (e) {}

        try {
            el.dispatchEvent(
                new InputEvent('beforeinput', {
                    inputType: 'insertText',
                    data: ch,
                    bubbles: true,
                    cancelable: true,
                })
            );
        } catch (e) {}

        let inserted = false;
        try {
            inserted = document.execCommand('insertText', false, ch);
        } catch (e) {}

        if (!inserted) {
            if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
                const s = el.selectionStart;
                const end = el.selectionEnd;
                const val = el.value || '';
                el.value = val.slice(0, s) + ch + val.slice(end);
                el.selectionStart = el.selectionEnd = s + ch.length;
                if (el._valueTracker) el._valueTracker.setValue(val);
            } else if (el.isContentEditable) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    const node = document.createTextNode(ch);
                    range.insertNode(node);
                    range.setStartAfter(node);
                    range.setEndAfter(node);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }

        try {
            el.dispatchEvent(
                new InputEvent('input', {
                    inputType: 'insertText',
                    data: ch,
                    bubbles: true,
                    cancelable: true,
                })
            );
        } catch (e) {}

        try {
            el.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: ch,
                    code: `Key${ch.toUpperCase()}`,
                    keyCode: keyCode,
                    which: keyCode,
                    bubbles: true,
                    cancelable: true,
                })
            );
        } catch (e) {}
    }

    function insertSingleChar(target, ch) {
        if (target.type === 'xterm') {
            const helper = target.element;
            if (helper) {
                helper.focus();
                dispatchAuthenticKeystroke(helper, ch);
            }
            return;
        }

        if (target.type === 'tinymce' && target.editor) {
            try {
                target.editor.insertContent(ch);
            } catch (_) {}
            return;
        }

        if (target.type === 'ace' && target.editor) {
            target.editor.setReadOnly(false);
            target.editor.session.replace(target.editor.getSelectionRange(), ch);
            return;
        }

        if (target.type === 'monaco' && target.editor) {
            target.editor.updateOptions({ readOnly: false });
            target.editor.trigger('keyboard', 'type', { text: ch });
            return;
        }

        if (target.type === 'codemirror' && target.editor) {
            target.editor.setOption('readOnly', false);
            target.editor.replaceSelection(ch);
            return;
        }

        const el = target.element;
        if (el) {
            el.focus();
            dispatchAuthenticKeystroke(el, ch);
        }
    }

    function executeBackspace(target) {
        if (target.type === 'xterm') {
            const helper = target.element;
            if (helper) {
                helper.focus();
                try {
                    helper.dispatchEvent(
                        new KeyboardEvent('keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                            keyCode: 8,
                            which: 8,
                            bubbles: true,
                            cancelable: true,
                        })
                    );
                    document.execCommand('delete', false, null);
                    helper.dispatchEvent(
                        new InputEvent('input', {
                            inputType: 'deleteContentBackward',
                            bubbles: true,
                            cancelable: true,
                        })
                    );
                } catch (e) {}
            }
            return;
        }

        if (target.type === 'tinymce' && target.editor) {
            try {
                target.editor.execCommand('delete');
            } catch (_) {}
            return;
        }

        if (target.type === 'ace' && target.editor) {
            target.editor.remove('left');
            return;
        }

        if (target.type === 'monaco' && target.editor) {
            target.editor.trigger('keyboard', 'deleteLeft');
            return;
        }

        if (target.type === 'codemirror' && target.editor) {
            target.editor.execCommand('delCharBefore');
            return;
        }

        const el = target.element;
        if (!el) return;

        el.focus();
        let deleted = false;
        try {
            const targetDoc = el.ownerDocument || document;
            deleted = targetDoc.execCommand('delete', false, null);
        } catch (e) {}

        if (!deleted) {
            if (typeof el.selectionStart === 'number' && el.selectionStart > 0) {
                const s = el.selectionStart;
                const val = el.value || '';
                el.value = val.slice(0, s - 1) + val.slice(s);
                el.selectionStart = el.selectionEnd = s - 1;
                if (el._valueTracker) el._valueTracker.setValue(val);
                el.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
            }
        }
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function startHumanTyping(rawText, customDelay, customTypoRate, customAutoBackspace) {
        const text = sanitizePastedText(rawText);
        if (!text || text.length === 0) return;
        stopHumanTyping();

        const session = { cancelled: false };
        currentTypingSession = session;
        const target = getTargetEditorOrElement();

        showTypingIndicator();

        const baseSpeed = customDelay || config.typingSpeed || 65;
        const typoChance =
            customTypoRate !== undefined
                ? customTypoRate > 1
                    ? customTypoRate / 100
                    : customTypoRate
                : config.typoRate !== undefined
                  ? config.typoRate > 1
                      ? config.typoRate / 100
                      : config.typoRate
                  : 0.04;
        const doAutoBackspace =
            customAutoBackspace !== undefined
                ? Boolean(customAutoBackspace)
                : config.autoBackspace !== undefined
                  ? Boolean(config.autoBackspace)
                  : true;

        for (const char of text) {
            if (session.cancelled) break;
            const neighbors = QWERTY_NEIGHBORS[char];

            // Realistic human typo decision
            const shouldMakeTypo = neighbors && neighbors.length > 0 && Math.random() < typoChance;

            if (shouldMakeTypo) {
                // 1. Type adjacent wrong key
                const typoChar = neighbors[Math.floor(Math.random() * neighbors.length)];
                insertSingleChar(target, typoChar);

                // 2. Human realization delay (noticing mistake ~120ms to 240ms)
                const realizeDelay = 120 + Math.random() * 120;
                await sleep(realizeDelay);
                if (session.cancelled) break;

                // 3. Auto backspace to fix
                if (doAutoBackspace) {
                    executeBackspace(target);

                    // 4. Pause after backspace (~80ms to 140ms)
                    const pauseDelay = 80 + Math.random() * 60;
                    await sleep(pauseDelay);
                    if (session.cancelled) break;
                }
            }

            // 5. Type correct character
            insertSingleChar(target, char);

            // 6. Natural human keystroke timing calculations
            let delay = baseSpeed * (0.65 + Math.random() * 0.7);

            if (char === ' ') {
                delay += baseSpeed * 1.2;
            } else if (char === '.' || char === ',' || char === ';' || char === ':') {
                delay += baseSpeed * 2.2;
            } else if (char === '\n') {
                delay += baseSpeed * 3.0; // Newline thinking pause
            } else if (char === '\t') {
                delay = baseSpeed * 0.4;
            }

            await sleep(delay);
        }

        if (currentTypingSession === session) {
            stopHumanTyping();
        }
    }

    /* ==========================================================================
     INSTANT FORCE PASTE
     ========================================================================== */

    function executeInstantPaste(rawText) {
        const text = sanitizePastedText(rawText);
        if (!text) return false;
        const target = getTargetEditorOrElement();

        if (target.type === 'xterm' && target.element) {
            target.element.focus();
            document.execCommand('insertText', false, text);
            return true;
        }

        if (target.type === 'tinymce' && target.editor) {
            try {
                target.editor.focus();
                target.editor.insertContent(text);
                return true;
            } catch (_) {}
        }

        if (target.type === 'ace' && target.editor) {
            target.editor.setReadOnly(false);
            target.editor.session.replace(target.editor.getSelectionRange(), text);
            target.editor.focus();
            return true;
        }

        if (target.type === 'monaco' && target.editor) {
            target.editor.updateOptions({ readOnly: false });
            target.editor.trigger('keyboard', 'type', { text: text });
            target.editor.focus();
            return true;
        }

        if (target.type === 'codemirror' && target.editor) {
            target.editor.setOption('readOnly', false);
            target.editor.replaceSelection(text);
            target.editor.focus();
            return true;
        }

        if (target.type === 'dom' && target.element) {
            const el = target.element;
            el.focus();

            let inserted = false;
            try {
                inserted = document.execCommand('insertText', false, text);
            } catch (e) {}

            if (!inserted) {
                if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const val = el.value || '';
                    el.value = val.slice(0, start) + text + val.slice(end);
                    el.selectionStart = el.selectionEnd = start + text.length;
                    if (el._valueTracker) el._valueTracker.setValue(val);
                    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    inserted = true;
                } else if (el.isContentEditable) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) {
                        const range = sel.getRangeAt(0);
                        range.deleteContents();
                        const textNode = document.createTextNode(text);
                        range.insertNode(textNode);
                        range.setStartAfter(textNode);
                        range.setEndAfter(textNode);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        inserted = true;
                    }
                }
            }
            return inserted;
        }

        return false;
    }

    /* ==========================================================================
     INTERCEPTING PASTE FOR "TYPING PASTE" SWITCH
     ========================================================================== */

    function requestClipboardAndType() {
        window.postMessage(
            {
                source: 'TITS_UNLOCKER_MAIN',
                type: 'REQUEST_CLIPBOARD_FOR_HUMAN_TYPING',
            },
            '*'
        );
    }

    function requestClipboardAndInstantPaste() {
        window.postMessage(
            {
                source: 'TITS_UNLOCKER_MAIN',
                type: 'REQUEST_CLIPBOARD_FOR_INSTANT_PASTE',
            },
            '*'
        );
    }

    // Intercept Ctrl+V / Cmd+V in capture phase
    window.addEventListener(
        'keydown',
        function (e) {
            const isPaste = (e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V');
            const isShiftInsert = e.shiftKey && e.key === 'Insert';

            if (isPaste || isShiftInsert) {
                // Let the browser emit its native paste event. That event
                // carries clipboardData even when readText is unavailable.
            }
        },
        true
    );

    window.addEventListener(
        'paste',
        function (e) {
            if (config.typingPasteEnabled) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const rawText = e.clipboardData ? e.clipboardData.getData('text/plain') || e.clipboardData.getData('text') : null;
                const text = sanitizePastedText(rawText);
                if (text) {
                    startHumanTyping(text);
                } else {
                    requestClipboardAndType();
                }
                return;
            }

            if (config.pasteEnabled) {
                const target = getTargetEditorOrElement();
                if (target.type === 'ace' || target.type === 'monaco' || target.type === 'codemirror') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const rawText = e.clipboardData ? e.clipboardData.getData('text/plain') || e.clipboardData.getData('text') : null;
                    if (rawText) {
                        executeInstantPaste(rawText);
                    } else {
                        requestClipboardAndInstantPaste();
                    }
                    return;
                }
            }
        },
        true
    );

    /* ==========================================================================
     SWITCH 1: NEUTER PREVENT-DEFAULT ON CLIPBOARD & SELECTION EVENTS
     ========================================================================== */

    const UNBLOCK_EVENT_TYPES = new Set([
        'paste',
        'beforepaste',
        'copy',
        'beforecopy',
        'cut',
        'beforecut',
        'contextmenu',
        'selectstart',
        'dragstart',
        'drop',
    ]);

    const originalPreventDefault = Event.prototype.preventDefault;
    Event.prototype.preventDefault = function () {
        if (!config.pasteEnabled) {
            return originalPreventDefault.apply(this, arguments);
        }

        const targetEl = this.target || this.srcElement;
        const isEditorInternal =
            targetEl &&
            ((targetEl.classList && (targetEl.classList.contains('ace_text-input') || targetEl.classList.contains('xterm-helper-textarea'))) ||
                (targetEl.closest && (targetEl.closest('.ace_editor') || targetEl.closest('.monaco-editor') || targetEl.closest('.CodeMirror'))));

        // Let Ace/Monaco's own hidden textarea handlers call preventDefault to avoid native double insertion
        if (isEditorInternal) {
            return originalPreventDefault.apply(this, arguments);
        }

        const eventType = (this.type || '').toLowerCase();
        if (UNBLOCK_EVENT_TYPES.has(eventType)) {
            if (eventType === 'paste' || eventType === 'beforepaste') {
                stats.pasteBlocksNeutralized++;
            } else if (eventType === 'contextmenu') {
                stats.contextMenuBlocksNeutralized++;
            } else if (eventType === 'selectstart') {
                stats.selectBlocksNeutralized++;
            }
            return;
        }

        if (eventType === 'keydown') {
            const key = (this.key || '').toLowerCase();
            const isMod = this.ctrlKey || this.metaKey;
            if (isMod && (key === 'v' || key === 'insert')) {
                stats.pasteBlocksNeutralized++;
                return;
            }
        }

        return originalPreventDefault.apply(this, arguments);
    };

    const originalStopImmediatePropagation = Event.prototype.stopImmediatePropagation;
    Event.prototype.stopImmediatePropagation = function () {
        if (!config.pasteEnabled) {
            return originalStopImmediatePropagation.apply(this, arguments);
        }

        const targetEl = this.target || this.srcElement;
        const isEditorInternal =
            targetEl &&
            ((targetEl.classList && (targetEl.classList.contains('ace_text-input') || targetEl.classList.contains('xterm-helper-textarea'))) ||
                (targetEl.closest && (targetEl.closest('.ace_editor') || targetEl.closest('.monaco-editor') || targetEl.closest('.CodeMirror'))));

        if (isEditorInternal) {
            return originalStopImmediatePropagation.apply(this, arguments);
        }

        const eventType = (this.type || '').toLowerCase();
        if (UNBLOCK_EVENT_TYPES.has(eventType)) {
            return;
        }
        if (eventType === 'keydown') {
            const key = (this.key || '').toLowerCase();
            const isMod = this.ctrlKey || this.metaKey;
            if (isMod && (key === 'v' || key === 'insert')) {
                return;
            }
        }
        return originalStopImmediatePropagation.apply(this, arguments);
    };

    /* ==========================================================================
     OVERRIDE DOM ON* PROPERTY HANDLERS
     ========================================================================== */

    const PROTOS = [
        window.HTMLElement,
        window.HTMLDocument,
        window.Window,
        window.HTMLInputElement,
        window.HTMLTextAreaElement,
        window.HTMLBodyElement,
    ];

    const HANDLER_PROPS = [
        'onpaste',
        'oncopy',
        'oncut',
        'onbeforepaste',
        'onbeforecopy',
        'onbeforecut',
        'oncontextmenu',
        'onselectstart',
        'ondragstart',
        'ondrop',
    ];

    for (const proto of PROTOS) {
        if (!proto || !proto.prototype) continue;
        for (const prop of HANDLER_PROPS) {
            try {
                Object.defineProperty(proto.prototype, prop, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return null;
                    },
                    set(_h) {
                        return true;
                    },
                });
            } catch (e) {}
        }
    }

    function walkDOM(root, callback) {
        if (!root) return;
        callback(root);
        if (root.querySelectorAll) {
            try {
                const elements = root.querySelectorAll('*');
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    callback(el);
                    if (el.shadowRoot) {
                        walkDOM(el.shadowRoot, callback);
                    }
                }
            } catch (e) {}
        }
    }

    function stripInlineAttributes(root) {
        if (!config.pasteEnabled) return;
        walkDOM(root, el => {
            if (!el.getAttribute) return;
            HANDLER_PROPS.forEach(attr => {
                if (el.hasAttribute && el.hasAttribute(attr)) {
                    el.removeAttribute(attr);
                }
            });
        });
    }

    /* ==========================================================================
     CSS INJECTION: SAFE SELECTION (NEVER SELECT GUTTER OR FONT-METRICS)
     ========================================================================== */

    function injectUnlockCSS() {
        if (!config.pasteEnabled) return;
        const styleId = '__tits_paste_unlocker_styles__';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
      /* Enable general text selection across normal page elements */
      body, p, span:not([class*="ace_"]):not([class*="monaco-"]), h1, h2, h3, h4, h5, h6, article, section,
      div:not([class*="ace_"]):not([class*="monaco-"]):not([class*="CodeMirror"]) {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      /* Keep inputs, textareas, and code containers writable and selectable */
      input, textarea, [contenteditable="true"], [contenteditable=""],
      .ace_text-input, .monaco-editor textarea, .CodeMirror textarea,
      .xterm-helper-textarea {
        -webkit-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
      }

      /* CRITICAL: Ace Editor & CodeMirror Gutters MUST NEVER BE SELECTABLE!
         This prevents line numbers (123456789...) and Ace font-metrics ('ה', 'X')
         from contaminating selections and copy buffers! */
      .ace_gutter,
      .ace_gutter *,
      .ace_gutter-cell,
      .ace_gutter-layer,
      .ace_testElement,
      .ace_font-metrics,
      [class*="ace_testElement"],
      [class*="font-metrics"],
      [class*="font_metrics"],
      .monaco-editor .margin,
      .monaco-editor .line-numbers,
      .CodeMirror-gutters,
      .CodeMirror-linenumber {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        pointer-events: none !important;
      }

      .anti-copy-overlay, .disable-selection, .no-select {
        pointer-events: none !important;
      }
    `;
        (document.head || document.documentElement).appendChild(style);
    }

    /* ==========================================================================
     ACE, MONACO & CODEMIRROR UNLOCKERS
     ========================================================================== */

    function patchAceEditorInstance(editor) {
        if (!editor || editor.__unlocker_inst_patched__) return;
        editor.__unlocker_inst_patched__ = true;

        try {
            editor.setReadOnly(false);

            // Clean paste event on editor to strip any gutter or font-metrics noise
            editor.on('paste', function (e) {
                if (e && e.text) {
                    e.text = sanitizePastedText(e.text);
                }
            });

            // Override getCopyText to ensure it only copies clean session code
            const origGetCopyText = editor.getCopyText;
            if (origGetCopyText) {
                editor.getCopyText = function () {
                    const raw = origGetCopyText.call(this);
                    return sanitizePastedText(raw);
                };
            }
        } catch (e) {}
    }

    function patchAcePrototype(ace) {
        if (!ace || !ace.Editor || ace.Editor.__unlocker_patched__) return;
        ace.Editor.__unlocker_patched__ = true;

        const origSetReadOnly = ace.Editor.prototype.setReadOnly;
        ace.Editor.prototype.setReadOnly = function (readOnly) {
            if (config.pasteEnabled) {
                return origSetReadOnly.call(this, false);
            }
            return origSetReadOnly.apply(this, arguments);
        };

        ace.Editor.prototype.getReadOnly = function () {
            return false;
        };
        if (ace.Editor.prototype.isReadOnly) {
            ace.Editor.prototype.isReadOnly = function () {
                return false;
            };
        }
    }

    let currentAce = window.ace;
    if (currentAce) {
        patchAcePrototype(currentAce);
    } else {
        try {
            Object.defineProperty(window, 'ace', {
                configurable: true,
                enumerable: true,
                get() {
                    return currentAce;
                },
                set(val) {
                    currentAce = val;
                    if (val) patchAcePrototype(val);
                },
            });
        } catch (e) {}
    }

    function unlockAceEditors() {
        if (!config.pasteEnabled) return;
        let count = 0;

        walkDOM(document, node => {
            if (node.classList && node.classList.contains('ace_editor')) {
                let ed = (node.env && node.env.editor) || node.aceEditor;
                if (ed) {
                    try {
                        ed.setReadOnly(false);
                        patchAceEditorInstance(ed);

                        if (ed.textInput) {
                            const el = typeof ed.textInput.getElement === 'function' ? ed.textInput.getElement() : ed.textInput;
                            if (el) {
                                el.readOnly = false;
                                el.removeAttribute('readonly');
                                el.removeAttribute('disabled');
                                el.removeAttribute('aria-disabled');
                            }
                        }
                        if (ed.container) {
                            ed.container.classList.remove('ace_readonly', 'disabled');
                        }
                        count++;
                    } catch (e) {}
                }
            }
            if (node.classList && node.classList.contains('ace_text-input')) {
                node.readOnly = false;
                node.removeAttribute('readonly');
                node.removeAttribute('disabled');
                node.removeAttribute('aria-disabled');
            }
        });

        if (count > 0) {
            stats.aceEditorsUnlocked = count;
            reportStats();
        }
    }

    function unlockMonacoEditors() {
        if (!config.pasteEnabled) return;
        if (window.monaco && window.monaco.editor && typeof window.monaco.editor.getEditors === 'function') {
            try {
                const monacoEditors = window.monaco.editor.getEditors();
                monacoEditors.forEach(ed => {
                    ed.updateOptions({ readOnly: false, domReadOnly: false });
                });
                if (monacoEditors.length > 0) {
                    stats.monacoEditorsUnlocked = monacoEditors.length;
                    reportStats();
                }
            } catch (e) {}
        }
        walkDOM(document, node => {
            if (node.closest && node.closest('.monaco-editor') && node.tagName === 'TEXTAREA') {
                node.readOnly = false;
                node.removeAttribute('readonly');
            }
        });
    }

    function unlockCodeMirrorEditors() {
        if (!config.pasteEnabled) return;
        let count = 0;
        walkDOM(document, node => {
            if (node.classList && node.classList.contains('CodeMirror') && node.CodeMirror) {
                node.CodeMirror.setOption('readOnly', false);
                count++;
            }
            if (node.classList && node.classList.contains('cm-content') && node.getAttribute('contenteditable') === 'false') {
                node.setAttribute('contenteditable', 'true');
                count++;
            }
        });
        if (count > 0) {
            stats.codeMirrorEditorsUnlocked = count;
            reportStats();
        }
    }

    function unlockStandardInputs() {
        if (!config.pasteEnabled) return;
        walkDOM(document, el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                if (el.getAttribute('data-unlocked') !== 'true') {
                    el.readOnly = false;
                    el.removeAttribute('readonly');
                    el.removeAttribute('disabled');
                    el.setAttribute('data-unlocked', 'true');
                }
            }
        });
    }

    /* ==========================================================================
     MESSAGING BRIDGE WITH ISOLATED WORLD
     ========================================================================== */

    window.addEventListener('message', function (event) {
        if (event.source !== window || !event.data || event.data.source !== 'TITS_UNLOCKER_ISOLATED') {
            return;
        }

        const { type, payload } = event.data;

        switch (type) {
            case 'EXECUTE_FORCE_PASTE':
                if (config.typingPasteEnabled) {
                    startHumanTyping(payload.text, payload.delay, payload.typoRate, payload.autoBackspace);
                } else {
                    executeInstantPaste(payload.text);
                }
                break;

            case 'EXECUTE_HUMAN_TYPING':
                startHumanTyping(payload.text, payload.delay, payload.typoRate, payload.autoBackspace);
                break;

            case 'STOP_HUMAN_TYPING':
                stopHumanTyping();
                break;

            case 'UPDATE_CONFIG':
                if (payload.pasteEnabled !== undefined) config.pasteEnabled = payload.pasteEnabled;
                if (payload.typingPasteEnabled !== undefined) config.typingPasteEnabled = payload.typingPasteEnabled;
                if (payload.typingSpeed !== undefined) config.typingSpeed = payload.typingSpeed;
                if (payload.typoRate !== undefined) config.typoRate = payload.typoRate;
                if (payload.autoBackspace !== undefined) config.autoBackspace = payload.autoBackspace;
                if (config.pasteEnabled) {
                    scanAndUnlock();
                }
                break;

            case 'TRIGGER_UNLOCK_ALL':
                unlockAceEditors();
                unlockMonacoEditors();
                unlockCodeMirrorEditors();
                unlockStandardInputs();
                stripInlineAttributes(document);
                injectUnlockCSS();
                reportStats();
                break;

            case 'REQUEST_STATS':
                reportStats();
                break;
        }
    });

    /* ==========================================================================
     LIFECYCLE & BACKGROUND SWEEP
     ========================================================================== */

    function scanAndUnlock() {
        if (!config.pasteEnabled) return;
        stripInlineAttributes(document);
        injectUnlockCSS();
        unlockAceEditors();
        unlockMonacoEditors();
        unlockCodeMirrorEditors();
    }

    function boot() {
        scanAndUnlock();

        const observer = new MutationObserver(mutations => {
            if (!config.pasteEnabled) return;
            for (const m of mutations) {
                if (m.type === 'attributes' && HANDLER_PROPS.map(p => p.slice(2)).includes(m.attributeName)) {
                    if (m.target && m.target.removeAttribute) {
                        m.target.removeAttribute(m.attributeName);
                    }
                }
                if (m.addedNodes && m.addedNodes.length) {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            stripInlineAttributes(node);
                            if (node.classList && (node.classList.contains('ace_editor') || node.querySelector?.('.ace_editor'))) {
                                unlockAceEditors();
                            }
                        }
                    });
                }
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: HANDLER_PROPS.map(p => p.slice(2)),
        });

        setInterval(scanAndUnlock, 1200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
