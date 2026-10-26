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
    }
});
