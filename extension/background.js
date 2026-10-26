/**
 * Ace & Universal Paste Unlocker - Background Service Worker
 * Handles context menus, extension hotkeys, badge updates, and tab messaging.
 */

const ext = typeof browser !== 'undefined' ? browser : chrome;

// Initialize context menus and default settings
ext.runtime.onInstalled.addListener(() => {
    // Set default configuration in storage
    ext.storage.local.get(['pasteEnabled', 'typingPasteEnabled', 'typingSpeed', 'typoRate'], res => {
        ext.storage.local.set({
            pasteEnabled: res.pasteEnabled ?? true,
            typingPasteEnabled: res.typingPasteEnabled ?? false,
            typingSpeed: res.typingSpeed ?? 65,
            typoRate: res.typoRate ?? 0.04,
        });
    });

    // Create Context Menus
    createContextMenus();
});

function createContextMenus() {
    ext.contextMenus.removeAll(() => {
        ext.contextMenus.create({
            id: 'force-paste-menu',
            title: '🔓 Force Paste Clipboard (Alt+V)',
            contexts: ['editable', 'page', 'selection'],
        });

        ext.contextMenus.create({
            id: 'stealth-paste-menu',
            title: '👻 Stealth Paste / Keystrokes (Alt+Shift+V)',
            contexts: ['editable', 'page', 'selection'],
        });

        ext.contextMenus.create({
            id: 'unlock-editors-menu',
            title: '⚡ Unlock Ace / Monaco / Page (Alt+U)',
            contexts: ['all'],
        });
    });
}

// Handle Context Menu Clicks
ext.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id) return;

    switch (info.menuItemId) {
        case 'force-paste-menu':
            ext.tabs.sendMessage(tab.id, { action: 'FORCE_PASTE' }, { frameId: info.frameId ?? 0 });
            break;
        case 'stealth-paste-menu':
            ext.tabs.sendMessage(tab.id, { action: 'HUMAN_TYPING_PASTE' }, { frameId: info.frameId ?? 0 });
            break;
        case 'unlock-editors-menu':
            ext.tabs.sendMessage(tab.id, { action: 'TRIGGER_UNLOCK_ALL' });
            break;
    }
});

// Handle Manifest Shortcut Commands (Alt+V, Alt+Shift+V, Alt+U)
ext.commands.onCommand.addListener(command => {
    ext.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs || !tabs[0] || !tabs[0].id) return;
        const tabId = tabs[0].id;

        if (command === 'force-paste') {
            ext.tabs.sendMessage(tabId, { action: 'FORCE_PASTE', fromShortcut: true });
        } else if (command === 'toggle-typing-paste') {
            ext.tabs.sendMessage(tabId, { action: 'HUMAN_TYPING_PASTE', fromShortcut: true });
        } else if (command === 'stop-typing') {
            ext.tabs.sendMessage(tabId, { action: 'STOP_TYPING' });
        } else if (command === 'unlock-all') {
            ext.tabs.sendMessage(tabId, { action: 'TRIGGER_UNLOCK_ALL' });
        }
    });
});

// Handle stats updates from content script & update badge
ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'UPDATE_STATS' && sender.tab && sender.tab.id) {
        const stats = message.stats;
        const tabId = sender.tab.id;

        if (stats.aceEditorsUnlocked > 0) {
            ext.action.setBadgeText({ text: 'ACE', tabId: tabId });
            ext.action.setBadgeBackgroundColor({ color: '#8b5cf6', tabId: tabId });
        } else if (stats.pasteBlocksNeutralized > 0 || stats.monacoEditorsUnlocked > 0) {
            const count = stats.pasteBlocksNeutralized + stats.monacoEditorsUnlocked;
            ext.action.setBadgeText({ text: count > 99 ? '99+' : count.toString(), tabId: tabId });
            ext.action.setBadgeBackgroundColor({ color: '#10b981', tabId: tabId });
        } else {
            ext.action.setBadgeText({ text: 'ON', tabId: tabId });
            ext.action.setBadgeBackgroundColor({ color: '#3b82f6', tabId: tabId });
        }
        return;
    }

    // ─── Remote Relay Handlers for Popup ─────────────────────────────────────
    if (message.action === 'REMOTE_GET_STATUS') {
        sendResponse({
            connected: remoteState.status === 'connected',
            status: remoteState.status,
            url: remoteState.url,
            room: remoteState.room,
            peersCount: remoteState.peersCount,
            logs: remoteState.logs,
            clientId: remoteState.clientId,
        });
        return true;
    }

    if (message.action === 'REMOTE_GET_DIAGNOSTICS') {
        const getManifest = () => (ext.runtime && ext.runtime.getManifest ? ext.runtime.getManifest() : {});
        try {
            ext.tabs.query({}, tabs => {
                const sanitizedTabs = (tabs || []).map(t => ({
                    id: t.id,
                    active: !!t.active,
                    windowId: t.windowId,
                    url: t.url || 'unknown',
                    title: t.title || 'Untitled',
                }));

                sendResponse({
                    success: true,
                    manifest: getManifest(),
                    remoteState: {
                        status: remoteState.status,
                        connected: remoteState.status === 'connected',
                        url: remoteState.url,
                        room: remoteState.room,
                        peersCount: remoteState.peersCount,
                        clientId: remoteState.clientId,
                        logs: [...remoteState.logs],
                    },
                    tabs: sanitizedTabs,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                });
            });
        } catch (err) {
            sendResponse({
                success: false,
                error: err.message,
                remoteState: { ...remoteState },
            });
        }
        return true;
    }

    if (message.action === 'REMOTE_CLEAR_LOGS') {
        remoteState.logs = [];
        sendResponse({ success: true });
        return true;
    }

    if (message.action === 'REMOTE_CONNECT') {
        connectRemote(message.url, message.room).then(res => sendResponse(res));
        return true;
    }

    if (message.action === 'REMOTE_DISCONNECT') {
        disconnectRemote();
        sendResponse({ success: true });
        return true;
    }

    if (message.action === 'REMOTE_SEND') {
        sendRemoteText(message.text, message.mode, message.delay, message.typoRate, message.autoBackspace).then(res => sendResponse(res));
        return true;
    }
});

/* ==========================================================================
   REMOTE EXTENSION RELAY CLIENT (Sender & Receiver over WebSocket)
   ========================================================================== */

let remoteWs = null;
const remoteState = {
    status: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
    url: 'ws://127.0.0.1:59432',
    room: 'ROOM-1',
    peersCount: 0,
    clientId: null,
    logs: [],
};

function addLog(type, text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isoTime = new Date().toISOString();
    remoteState.logs.unshift({ type, text, time, isoTime });
    if (remoteState.logs.length > 100) remoteState.logs.pop();
}

function sendWs(data) {
    if (remoteWs && remoteWs.readyState === WebSocket.OPEN) {
        try {
            remoteWs.send(JSON.stringify(data));
            return true;
        } catch (_) {}
    }
    return false;
}

function findInjectableTab() {
    return new Promise(resolve => {
        try {
            ext.tabs.query({}, allTabs => {
                if (!allTabs || !allTabs.length) return resolve(null);

                const isInjectable = tab => {
                    if (!tab || !tab.id) return false;
                    const u = (tab.url || tab.pendingUrl || '').toLowerCase();
                    if (!u) return true;
                    return (
                        !u.startsWith('chrome://') &&
                        !u.startsWith('brave://') &&
                        !u.startsWith('edge://') &&
                        !u.startsWith('chrome-extension://') &&
                        !u.startsWith('about:') &&
                        !u.startsWith('devtools://')
                    );
                };

                const validTabs = allTabs.filter(isInjectable);
                if (!validTabs.length) return resolve(null);

                // 1. Prioritize active tab in last focused window
                const activeFocused = validTabs.find(t => t.active && t.lastFocusedWindow);
                if (activeFocused) return resolve(activeFocused);

                // 2. Prioritize any active tab in any window
                const activeTab = validTabs.find(t => t.active);
                if (activeTab) return resolve(activeTab);

                // 3. Fallback to first valid webpage tab
                return resolve(validTabs[0]);
            });
        } catch (_) {
            resolve(null);
        }
    });
}

function directScriptInject(tabId, text, mode, delay, typoRate, autoBackspace) {
    return new Promise(resolve => {
        if (!ext.scripting || !ext.scripting.executeScript) {
            return resolve({ success: false, reason: 'Scripting API unavailable' });
        }

        ext.scripting.executeScript(
            {
                target: { tabId },
                func: async (injectText, injectMode, injectDelay, injectTypoRate, injectAutoBackspace) => {
                    function getDeepActive(root = document) {
                        let a = root.activeElement;
                        while (a && a.shadowRoot && a.shadowRoot.activeElement) {
                            a = a.shadowRoot.activeElement;
                        }
                        return a;
                    }

                    const sleep = ms => new Promise(r => setTimeout(r, ms));
                    const isTypeMode = injectMode === 'type';
                    const baseDelay = typeof injectDelay === 'number' ? injectDelay : 65;
                    const typoChance = typeof injectTypoRate === 'number' ? (injectTypoRate > 1 ? injectTypoRate / 100 : injectTypoRate) : 0.04;
                    const doAutoBackspace = injectAutoBackspace !== undefined ? Boolean(injectAutoBackspace) : true;

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

                    async function runTypingLoop(typeCharFn, backspaceFn) {
                        for (let i = 0; i < injectText.length; i++) {
                            const ch = injectText[i];
                            const lower = ch.toLowerCase();
                            const neighbors = QWERTY_NEIGHBORS[lower];
                            const shouldTypo = neighbors && neighbors.length > 0 && Math.random() < typoChance;

                            if (shouldTypo) {
                                const rawTypo = neighbors[Math.floor(Math.random() * neighbors.length)];
                                const typoChar = ch === ch.toUpperCase() && ch !== lower ? rawTypo.toUpperCase() : rawTypo;

                                // 1. Type wrong key
                                typeCharFn(typoChar);

                                // 2. Realization delay (human noticing error ~120 - 240ms)
                                await sleep(120 + Math.random() * 120);

                                if (doAutoBackspace) {
                                    // 3. Auto backspace delete
                                    backspaceFn();

                                    // 4. Pause after backspace (~80 - 140ms)
                                    await sleep(80 + Math.random() * 60);
                                }
                            }

                            // 5. Type correct char
                            typeCharFn(ch);

                            // 6. Natural human keystroke timing
                            let d = baseDelay * (0.65 + Math.random() * 0.7);
                            if (ch === ' ') d += baseDelay * 1.2;
                            else if (ch === '\n') d += baseDelay * 2.8;
                            else if (ch === '.' || ch === ',' || ch === ';' || ch === ':') d += baseDelay * 2.0;
                            await sleep(Math.max(15, d));
                        }
                    }

                    let el = getDeepActive() || document.activeElement;

                    // 1. TinyMCE Editor Check (used by OnlineNotepad, WordPress, CMS apps)
                    if (window.tinymce && window.tinymce.editors && window.tinymce.editors.length > 0) {
                        const ed = window.tinymce.activeEditor || window.tinymce.editors[0];
                        if (ed) {
                            try {
                                ed.focus();
                                if (isTypeMode) {
                                    await runTypingLoop(
                                        c => ed.insertContent(c),
                                        () => {
                                            try {
                                                ed.execCommand('delete');
                                            } catch (_) {}
                                        }
                                    );
                                } else {
                                    ed.insertContent(injectText);
                                }
                                return { success: true, target: 'tinymce' };
                            } catch (_) {}
                        }
                    }

                    // 2. Monaco Editor Check
                    if (window.monaco && window.monaco.editor && window.monaco.editor.getEditors) {
                        const eds = window.monaco.editor.getEditors();
                        if (eds && eds.length > 0) {
                            eds[0].focus();
                            if (isTypeMode) {
                                await runTypingLoop(
                                    c => eds[0].trigger('keyboard', 'type', { text: c }),
                                    () => {
                                        try {
                                            eds[0].trigger('keyboard', 'deleteLeft');
                                        } catch (_) {}
                                    }
                                );
                            } else {
                                eds[0].trigger('keyboard', 'type', { text: injectText });
                            }
                            return { success: true, target: 'monaco' };
                        }
                    }

                    // 3. Ace Editor Check
                    const aceNode = document.querySelector('.ace_editor');
                    if (aceNode && aceNode.env && aceNode.env.editor) {
                        const aceEd = aceNode.env.editor;
                        aceEd.focus();
                        if (isTypeMode) {
                            await runTypingLoop(
                                c => aceEd.session.replace(aceEd.getSelectionRange(), c),
                                () => {
                                    try {
                                        aceEd.remove('left');
                                    } catch (_) {}
                                }
                            );
                        } else {
                            aceEd.session.replace(aceEd.getSelectionRange(), injectText);
                        }
                        return { success: true, target: 'ace' };
                    }

                    // 4. CodeMirror Check
                    const cmNode = document.querySelector('.CodeMirror');
                    if (cmNode && cmNode.CodeMirror) {
                        const cm = cmNode.CodeMirror;
                        cm.focus();
                        if (isTypeMode) {
                            await runTypingLoop(
                                c => cm.replaceSelection(c),
                                () => {
                                    try {
                                        cm.execCommand('delCharBefore');
                                    } catch (_) {}
                                }
                            );
                        } else {
                            cm.replaceSelection(injectText);
                        }
                        return { success: true, target: 'codemirror' };
                    }

                    // 5. If active element is an IFRAME, drill into its document
                    if (el && el.tagName === 'IFRAME') {
                        try {
                            const doc = el.contentDocument || (el.contentWindow && el.contentWindow.document);
                            if (doc && doc.body) {
                                el = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : doc.body;
                            }
                        } catch (_) {}
                    }

                    // 6. If el is still body/null/iframe, search for rich text iframe (like TinyMCE #editor_ifr) or standard inputs
                    if (!el || el === document.body || el === document.documentElement || el.tagName === 'IFRAME') {
                        // Check iframes first (e.g. OnlineNotepad #editor_ifr)
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
                                    el = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : doc.body;
                                    break;
                                }
                            } catch (_) {}
                        }

                        // Then standard inputs
                        if (!el || el === document.body || el === document.documentElement || el.tagName === 'IFRAME') {
                            const candidates = document.querySelectorAll(
                                'textarea:not([disabled]):not([readonly]), input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly]), [contenteditable="true"]:not([contenteditable="false"]), [role="textbox"], .ql-editor, .ProseMirror'
                            );
                            for (const cand of candidates) {
                                const rect = cand.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                    el = cand;
                                    break;
                                }
                            }
                        }
                    }

                    // Always ensure text is copied to local clipboard buffer so Ctrl+V or Alt+V works instantly
                    try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(injectText).catch(() => {});
                        }
                    } catch (_) {}

                    if (!el || el === document.body || el === document.documentElement || el.tagName === 'IFRAME') {
                        return { success: true, target: 'clipboard', reason: 'Copied to clipboard (ready for Ctrl+V)' };
                    }

                    const doc = el.ownerDocument || document;
                    const win = doc.defaultView || window;

                    try {
                        el.focus();
                    } catch (_) {}

                    if (isTypeMode) {
                        const typeGeneral = ch => {
                            const keyCode = ch.charCodeAt(0);
                            try {
                                el.dispatchEvent(
                                    new KeyboardEvent('keydown', {
                                        key: ch,
                                        code: `Key${ch.toUpperCase()}`,
                                        keyCode,
                                        which: keyCode,
                                        bubbles: true,
                                        cancelable: true,
                                    })
                                );
                            } catch (_) {}

                            let ins = false;
                            try {
                                ins = doc.execCommand('insertText', false, ch);
                            } catch (_) {}

                            if (!ins && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                                const start = el.selectionStart ?? el.value.length;
                                const end = el.selectionEnd ?? el.value.length;
                                const oldVal = el.value || '';
                                el.value = oldVal.slice(0, start) + ch + oldVal.slice(end);
                                el.selectionStart = el.selectionEnd = start + ch.length;
                                el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                                ins = true;
                            }

                            if (
                                !ins &&
                                (el.isContentEditable ||
                                    doc.designMode === 'on' ||
                                    el.id === 'tinymce' ||
                                    (el.classList && el.classList.contains('mce-content-body')))
                            ) {
                                const sel = win.getSelection();
                                if (sel && sel.rangeCount > 0) {
                                    const range = sel.getRangeAt(0);
                                    range.deleteContents();
                                    const tn = doc.createTextNode(ch);
                                    range.insertNode(tn);
                                    range.setStartAfter(tn);
                                    range.setEndAfter(tn);
                                    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                    ins = true;
                                } else {
                                    const tn = doc.createTextNode(ch);
                                    el.appendChild(tn);
                                    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                    ins = true;
                                }
                            }

                            try {
                                el.dispatchEvent(
                                    new KeyboardEvent('keyup', {
                                        key: ch,
                                        code: `Key${ch.toUpperCase()}`,
                                        keyCode,
                                        which: keyCode,
                                        bubbles: true,
                                        cancelable: true,
                                    })
                                );
                            } catch (_) {}
                        };

                        const backspaceGeneral = () => {
                            let del = false;
                            try {
                                del = doc.execCommand('delete', false, null);
                            } catch (_) {}

                            if (!del && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                                const start = el.selectionStart ?? el.value.length;
                                if (start > 0) {
                                    const oldVal = el.value || '';
                                    el.value = oldVal.slice(0, start - 1) + oldVal.slice(start);
                                    el.selectionStart = el.selectionEnd = start - 1;
                                    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                                }
                            }
                        };

                        await runTypingLoop(typeGeneral, backspaceGeneral);
                    } else {
                        // Instant paste insert
                        let inserted = false;
                        try {
                            inserted = doc.execCommand('insertText', false, injectText);
                        } catch (_) {}

                        if (!inserted && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                            const start = el.selectionStart ?? el.value.length;
                            const end = el.selectionEnd ?? el.value.length;
                            const oldVal = el.value || '';
                            el.value = oldVal.slice(0, start) + injectText + oldVal.slice(end);
                            el.selectionStart = el.selectionEnd = start + injectText.length;
                            el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                            inserted = true;
                        }

                        if (
                            !inserted &&
                            (el.isContentEditable ||
                                doc.designMode === 'on' ||
                                el.id === 'tinymce' ||
                                (el.classList && el.classList.contains('mce-content-body')))
                        ) {
                            const sel = win.getSelection();
                            if (sel && sel.rangeCount > 0) {
                                const range = sel.getRangeAt(0);
                                range.deleteContents();
                                const tn = doc.createTextNode(injectText);
                                range.insertNode(tn);
                                range.setStartAfter(tn);
                                range.setEndAfter(tn);
                                el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                inserted = true;
                            } else {
                                const tn = doc.createTextNode(injectText);
                                el.appendChild(tn);
                                el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                                inserted = true;
                            }
                        }
                    }

                    return { success: true, target: el.id || (el.tagName ? el.tagName.toLowerCase() : 'page') };
                },
                args: [text, mode, delay, typoRate, autoBackspace],
            },
            results => {
                if (ext.runtime.lastError) {
                    return resolve({ success: false, reason: ext.runtime.lastError.message });
                }
                const res = results && results[0] && results[0].result;
                resolve(res || { success: true });
            }
        );
    });
}

async function handleIncomingRemoteText(data) {
    const { text, mode, delay, typoRate, autoBackspace } = data;
    const safeMode = mode || 'paste';
    const safeDelay = delay || 65;
    const safeTypo = typoRate !== undefined ? typoRate : 4;
    const safeBackspace = autoBackspace !== undefined ? autoBackspace : true;

    addLog('recv', `Received ${text.length} chars [${safeMode} | ${safeDelay}ms | ${safeTypo}% typos] from peer`);

    const targetTab = await findInjectableTab();

    if (!targetTab || !targetTab.id) {
        addLog('err', 'No open webpage found (open google.com or test page in receiver browser)');
        sendWs({ type: 'relay_ack', status: 'error', message: 'No open webpage in receiver browser (only system/blank tabs)' });
        return;
    }

    const tabLabel = targetTab.title ? (targetTab.title.length > 28 ? targetTab.title.slice(0, 28) + '…' : targetTab.title) : `Tab ${targetTab.id}`;
    addLog('info', `Target tab: ${tabLabel} [ID: ${targetTab.id}]`);

    ext.tabs.sendMessage(
        targetTab.id,
        {
            action: 'REMOTE_INJECT',
            text,
            mode: safeMode,
            delay: safeDelay,
            typoRate: safeTypo,
            autoBackspace: safeBackspace,
        },
        async res => {
            if (res && res.success) {
                addLog('ok', `Injected into tab (${safeMode === 'type' ? 'Human typing' : 'Instant paste'}) ✓`);
                sendWs({ type: 'relay_ack', status: 'ok', message: `Injected into page (${safeMode})` });
                return;
            }

            // If content script was unhooked or window blurred, fall back to directScriptInject
            const directRes = await directScriptInject(targetTab.id, text, safeMode, safeDelay, safeTypo, safeBackspace);
            if (directRes && directRes.success) {
                addLog('ok', `Injected into tab (${directRes.target || safeMode}) ✓`);
                sendWs({ type: 'relay_ack', status: 'ok', message: `Injected into page (${directRes.target || safeMode})` });
            } else {
                addLog('warn', `Delivery report: ${directRes?.reason || 'No focused input'}`);
                sendWs({ type: 'relay_ack', status: 'warn', message: directRes?.reason || 'No focused input' });
            }
        }
    );
}

function connectRemote(url, room) {
    return new Promise(resolve => {
        const targetUrl = (url || remoteState.url || 'ws://127.0.0.1:59432').trim();
        const targetRoom = (room || remoteState.room || 'ROOM-1').trim().toUpperCase();

        disconnectRemote();

        remoteState.status = 'connecting';
        remoteState.url = targetUrl;
        remoteState.room = targetRoom;
        addLog('info', `Connecting to ${targetUrl} (Room: ${targetRoom})…`);

        ext.storage.local.set({ remoteWsUrl: targetUrl, remoteRoom: targetRoom });

        try {
            remoteWs = new WebSocket(targetUrl);
        } catch (err) {
            remoteState.status = 'disconnected';
            addLog('err', `Connection error: ${err.message}`);
            return resolve({ success: false, error: err.message });
        }

        let resolved = false;

        remoteWs.onopen = () => {
            remoteState.status = 'connected';
            addLog('ok', `Connected to server. Joining room ${targetRoom}…`);
            sendWs({ type: 'join', room: targetRoom });
            if (!resolved) {
                resolved = true;
                resolve({ success: true, room: targetRoom });
            }
        };

        remoteWs.onmessage = evt => {
            try {
                const msg = JSON.parse(evt.data);
                if (msg.type === 'hello') {
                    remoteState.clientId = msg.clientId;
                } else if (msg.type === 'room_state') {
                    remoteState.peersCount = msg.peersCount || 1;
                    addLog('info', `Room ${msg.room}: ${msg.peersCount} peer(s) connected`);
                } else if (msg.type === 'remote_inject') {
                    handleIncomingRemoteText(msg);
                } else if (msg.type === 'peer_ack') {
                    addLog('ack', `Peer feedback: ${msg.message || msg.status}`);
                } else if (msg.type === 'ack') {
                    if (msg.status === 'error') {
                        addLog('err', `Server: ${msg.message}`);
                    }
                }
            } catch (_) {}
        };

        remoteWs.onclose = () => {
            remoteState.status = 'disconnected';
            remoteState.peersCount = 0;
            addLog('info', 'Disconnected from remote server');
            remoteWs = null;
            if (!resolved) {
                resolved = true;
                resolve({ success: false, error: 'Connection closed' });
            }
        };

        remoteWs.onerror = () => {
            remoteState.status = 'disconnected';
            addLog('err', 'Failed to reach remote server');
            if (!resolved) {
                resolved = true;
                resolve({ success: false, error: 'Connection error' });
            }
        };
    });
}

function disconnectRemote() {
    if (remoteWs) {
        try {
            remoteWs.close();
        } catch (_) {}
        remoteWs = null;
    }
    remoteState.status = 'disconnected';
    remoteState.peersCount = 0;
}

function sendRemoteText(text, mode, delay, typoRate, autoBackspace) {
    return new Promise(resolve => {
        if (!text || !text.trim()) {
            return resolve({ success: false, error: 'Text cannot be empty' });
        }
        if (remoteState.status !== 'connected' || !remoteWs) {
            return resolve({ success: false, error: 'Not connected to remote server' });
        }

        const payload = {
            type: 'relay',
            room: remoteState.room,
            text,
            mode: mode === 'type' ? 'type' : 'paste',
            delay: typeof delay === 'number' ? delay : 65,
            typoRate: typeof typoRate === 'number' ? typoRate : 4,
            autoBackspace: autoBackspace !== undefined ? Boolean(autoBackspace) : true,
        };

        const sent = sendWs(payload);
        if (sent) {
            addLog(
                'sent',
                `Sent ${text.length} chars (${payload.mode} | ${payload.delay}ms | ${payload.typoRate}% typos) to Room ${remoteState.room}`
            );
            resolve({ success: true, recipients: remoteState.peersCount > 1 ? remoteState.peersCount - 1 : 0 });
        } else {
            resolve({ success: false, error: 'Failed to send over WebSocket' });
        }
    });
}

// Restore saved settings on startup
ext.storage.local.get(['remoteWsUrl', 'remoteRoom', 'remoteAutoConnect'], res => {
    if (res.remoteWsUrl) remoteState.url = res.remoteWsUrl;
    if (res.remoteRoom) remoteState.room = res.remoteRoom;
    if (res.remoteAutoConnect) {
        connectRemote(remoteState.url, remoteState.room);
    }
});
