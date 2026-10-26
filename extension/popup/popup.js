/**
 * TITS - Minimalist Popup Controller
 */

const ext = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
    // Primary Switches
    const togglePasteEnable = document.getElementById('toggle-paste-enable');
    const toggleTypingPaste = document.getElementById('toggle-typing-paste');

    // Sliders & Labels
    const sliderSpeed = document.getElementById('slider-speed');
    const speedLabel = document.getElementById('speed-label');
    const sliderTypo = document.getElementById('slider-typo');
    const typoLabel = document.getElementById('typo-label');

    // Action Buttons
    const btnForcePaste = document.getElementById('btn-force-paste');
    const btnHumanType = document.getElementById('btn-human-type');
    const btnStopTyping = document.getElementById('btn-stop-typing');
    const btnUnlockAll = document.getElementById('btn-unlock-all');

    // Status Indicator
    const globalStatusPill = document.getElementById('global-status-pill');
    const statusText = document.getElementById('status-text');

    // Helper: Format Speed Label
    function updateSpeedDisplay(val) {
        if (speedLabel) speedLabel.textContent = `${val} ms`;
    }

    // Helper: Format Typo Label
    function updateTypoDisplay(val) {
        if (typoLabel) typoLabel.textContent = `${val}%`;
    }

    // Load Saved Settings from Extension Storage
    ext.storage.local.get(['pasteEnabled', 'typingPasteEnabled', 'typingSpeed', 'typoRate'], res => {
        const pasteEnabled = res.pasteEnabled !== undefined ? res.pasteEnabled : true;
        const typingPasteEnabled = res.typingPasteEnabled !== undefined ? res.typingPasteEnabled : false;
        const typingSpeed = res.typingSpeed !== undefined ? res.typingSpeed : 65;
        const typoRatePercent = res.typoRate !== undefined ? Math.round(res.typoRate * 100) : 4;

        if (togglePasteEnable) togglePasteEnable.checked = pasteEnabled;
        if (toggleTypingPaste) toggleTypingPaste.checked = typingPasteEnabled;
        if (sliderSpeed) sliderSpeed.value = typingSpeed;
        if (sliderTypo) sliderTypo.value = typoRatePercent;

        updateSpeedDisplay(typingSpeed);
        updateTypoDisplay(typoRatePercent);
        updateGlobalStatus(pasteEnabled, typingPasteEnabled);
    });

    function updateGlobalStatus(pasteOn, typingOn) {
        if (!statusText || !globalStatusPill) return;
        if (typingOn) {
            statusText.textContent = 'Typing';
            globalStatusPill.className = 'status-pill active';
            globalStatusPill.style.color = '#10b981';
            globalStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        } else if (pasteOn) {
            statusText.textContent = 'Active';
            globalStatusPill.className = 'status-pill active';
            globalStatusPill.style.color = '#facc15';
            globalStatusPill.style.borderColor = 'rgba(250, 204, 21, 0.4)';
        } else {
            statusText.textContent = 'Idle';
            globalStatusPill.className = 'status-pill';
            globalStatusPill.style.color = '#94a3b8';
            globalStatusPill.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        }
    }

    // Primary Switch 1: Paste Enable
    if (togglePasteEnable) {
        togglePasteEnable.addEventListener('change', () => {
            const isChecked = togglePasteEnable.checked;
            ext.storage.local.set({ pasteEnabled: isChecked });
            updateGlobalStatus(isChecked, toggleTypingPaste ? toggleTypingPaste.checked : false);
        });
    }

    // Primary Switch 2: Typing Paste
    if (toggleTypingPaste) {
        toggleTypingPaste.addEventListener('change', () => {
            const isChecked = toggleTypingPaste.checked;
            ext.storage.local.set({ typingPasteEnabled: isChecked });
            updateGlobalStatus(togglePasteEnable ? togglePasteEnable.checked : true, isChecked);
        });
    }

    // Sliders
    if (sliderSpeed) {
        sliderSpeed.addEventListener('input', () => {
            const val = parseInt(sliderSpeed.value, 10);
            updateSpeedDisplay(val);
            ext.storage.local.set({ typingSpeed: val });
        });
    }

    if (sliderTypo) {
        sliderTypo.addEventListener('input', () => {
            const val = parseInt(sliderTypo.value, 10);
            updateTypoDisplay(val);
            ext.storage.local.set({ typoRate: val / 100 });
        });
    }

    // Query Active Tab
    async function getActiveTab() {
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        return tabs[0];
    }

    function flashButton(btn, text, origText, duration = 1000) {
        if (!btn) return;
        btn.textContent = text;
        setTimeout(() => {
            btn.textContent = origText;
        }, duration);
    }

    // Action: Force Paste (Alt+V)
    if (btnForcePaste) {
        btnForcePaste.addEventListener('click', async () => {
            const orig = btnForcePaste.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'FORCE_PASTE' }, res => {
                if (res && res.success) {
                    flashButton(btnForcePaste, 'Done', orig);
                } else {
                    flashButton(btnForcePaste, 'Focus first', orig);
                }
            });
        });
    }

    // Action: Type (Alt+Shift+V)
    if (btnHumanType) {
        btnHumanType.addEventListener('click', async () => {
            const orig = btnHumanType.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'HUMAN_TYPING_PASTE' }, res => {
                if (res && res.success) {
                    flashButton(btnHumanType, 'Typing', orig);
                } else {
                    flashButton(btnHumanType, 'Focus first', orig);
                }
            });
        });
    }

    // Action: Stop (Esc)
    if (btnStopTyping) {
        btnStopTyping.addEventListener('click', async () => {
            const orig = btnStopTyping.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'STOP_TYPING' }, () => {
                flashButton(btnStopTyping, 'Stopped', orig);
            });
        });
    }

    // Action: Unlock (Alt+U)
    if (btnUnlockAll) {
        btnUnlockAll.addEventListener('click', async () => {
            const orig = btnUnlockAll.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'TRIGGER_UNLOCK_ALL' }, () => {
                flashButton(btnUnlockAll, 'Unlocked', orig);
            });
        });
    }
});
