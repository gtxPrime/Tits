/**
 * TITS - Paste & Editor Unlocker (Isolated Content Script)
 * Bridges extension APIs (clipboard, background messages, storage, hotkeys)
 * with the page's MAIN world script.
 */

(function () {
    'use strict';

    const ext = typeof browser !== 'undefined' ? browser : chrome;

    let currentStats = {
        aceEditorsUnlocked: 0,
        monacoEditorsUnlocked: 0,
        codeMirrorEditorsUnlocked: 0,
        pasteBlocksNeutralized: 0,
        contextMenuBlocksNeutralized: 0,
        selectBlocksNeutralized: 0,
        humanTypingActive: false,
    };

    let lastShortcut = { action: '', at: 0 };
    async function runPasteAction(action, shortcut = false) {
        if (shortcut) {
            const now = Date.now();
            if (lastShortcut.action === action && now - lastShortcut.at < 250) return true;
            lastShortcut = { action, at: now };
        }
        const text = await getClipboardText();
        if (typeof text !== 'string' || !text.length) return false;
        postToMainWorld(action === 'FORCE_PASTE' ? 'EXECUTE_FORCE_PASTE' : 'EXECUTE_HUMAN_TYPING', { text });
        return true;
    }

    /* ==========================================================================
     1. FALLBACK MAIN-WORLD SCRIPT INJECTION
     ========================================================================== */

    function injectMainWorldFallback() {
        const inject = () => {
            const root = document.head || document.documentElement;
            if (!root) return false;
            const script = document.createElement('script');
            script.src = ext.runtime.getURL('content-main.js');
            script.onload = () => {
                script.remove();
                syncConfigWithMainWorld();
            };
            script.onerror = () => script.remove();
            root.appendChild(script);
            return true;
        };
        if (inject()) return;
        const observer = new MutationObserver(() => {
            if (inject()) observer.disconnect();
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    injectMainWorldFallback();

    /* ==========================================================================
     2. CLIPBOARD READING
     ========================================================================== */

    async function getClipboardText() {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
                const text = await navigator.clipboard.readText();
                if (text) return text;
            }
        } catch (err) {}

        try {
            const response = await new Promise(resolve => {
                ext.runtime.sendMessage({ action: 'READ_CLIPBOARD' }, res => resolve(res));
            });
            if (response && response.text) return response.text;
        } catch (e) {}

        return null;
    }

    /* ==========================================================================
     3. MESSAGING WITH MAIN WORLD (content-main.js)
     ========================================================================== */

    function postToMainWorld(type, payload = {}) {
        window.postMessage(
            {
                source: 'TITS_UNLOCKER_ISOLATED',
                type: type,
                payload: payload,
            },
            '*'
        );
    }

    function syncConfigWithMainWorld() {
        ext.storage.local.get(['pasteEnabled', 'typingPasteEnabled', 'typingSpeed', 'typoRate'], items => {
            postToMainWorld('UPDATE_CONFIG', {
                pasteEnabled: items.pasteEnabled !== undefined ? items.pasteEnabled : true,
                typingPasteEnabled: items.typingPasteEnabled !== undefined ? items.typingPasteEnabled : false,
                typingSpeed: items.typingSpeed !== undefined ? items.typingSpeed : 65,
                typoRate: items.typoRate !== undefined ? items.typoRate : 0.04,
            });
        });
    }

    ext.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            syncConfigWithMainWorld();
        }
    });

    window.addEventListener('message', async function (event) {
        if (event.source !== window || !event.data || event.data.source !== 'TITS_UNLOCKER_MAIN') {
            return;
        }

        if (event.data.type === 'REQUEST_CLIPBOARD_FOR_HUMAN_TYPING') {
            const text = await getClipboardText();
            if (text) {
                postToMainWorld('EXECUTE_HUMAN_TYPING', { text });
            }
            return;
        }

        if (event.data.type === 'REQUEST_CLIPBOARD_FOR_INSTANT_PASTE') {
            const text = await getClipboardText();
            if (text) {
                postToMainWorld('EXECUTE_FORCE_PASTE', { text });
            }
            return;
        }

        if (event.data.type === 'STATS_UPDATE') {
            currentStats = { ...currentStats, ...event.data.stats };
            try {
                ext.runtime.sendMessage({
                    action: 'UPDATE_STATS',
                    stats: currentStats,
                });
            } catch (e) {}
        }
    });

    /* ==========================================================================
     4. DIRECT KEYBOARD SHORTCUTS
     ========================================================================== */

    window.addEventListener(
        'keydown',
        async function (e) {
            const isAlt = e.altKey;
            const isShift = e.shiftKey;
            const key = (e.key || '').toLowerCase();

            // Keep an in-page fallback: browser shortcut assignment may be
            // unavailable or remapped. Deduplicate with the commands API path.
            if (isAlt && key === 'v') {
                e.preventDefault();
                await runPasteAction(isShift ? 'HUMAN_TYPING_PASTE' : 'FORCE_PASTE', true);
                return;
            }
            if (isAlt && key === 'x') {
                postToMainWorld('STOP_HUMAN_TYPING');
                return;
            }

            // Alt + U : Force Unlock Editors & Page
            if (isAlt && key === 'u') {
                e.preventDefault();
                postToMainWorld('TRIGGER_UNLOCK_ALL');
                return;
            }

            // Escape remains available even if extension shortcuts are remapped.
            if (key === 'escape') postToMainWorld('STOP_HUMAN_TYPING');
        },
        true
    );

    /* ==========================================================================
     5. LISTEN FOR COMMANDS FROM BACKGROUND & POPUP
     ========================================================================== */

    ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (!request || !request.action) return;

        switch (request.action) {
            case 'FORCE_PASTE':
            case 'HUMAN_TYPING_PASTE':
                // Only the focused frame handles browser-wide shortcuts.
                if (request.fromShortcut && !document.hasFocus()) return;
                runPasteAction(request.action, !!request.fromShortcut).then(success => {
                    sendResponse({ success, reason: success ? undefined : 'Clipboard empty or inaccessible' });
                });
                return true;

            case 'STOP_TYPING':
                postToMainWorld('STOP_HUMAN_TYPING');
                sendResponse({ success: true });
                break;

            case 'TRIGGER_UNLOCK_ALL':
                postToMainWorld('TRIGGER_UNLOCK_ALL');
                sendResponse({ success: true });
                break;

            case 'GET_PAGE_STATS':
                postToMainWorld('REQUEST_STATS');
                sendResponse({ stats: currentStats });
                break;
        }
    });

    setTimeout(() => {
        syncConfigWithMainWorld();
        postToMainWorld('REQUEST_STATS');
    }, 400);
})();
