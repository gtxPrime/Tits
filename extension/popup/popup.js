/**
 * Ace & Universal Paste Unlocker - Popup Controller
 * Manages the Two Primary Switches:
 *  1. Paste Enable & Unlocker
 *  2. Human Typing Paste (with speed, typos & backspace fixes)
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

    // Telemetry Displays
    const statAce = document.getElementById('stat-ace');
    const statPasteBlocked = document.getElementById('stat-paste-blocked');
    const statOtherEditors = document.getElementById('stat-other-editors');
    const statTypingState = document.getElementById('stat-typing-state');
    const globalStatusPill = document.getElementById('global-status-pill');
    const statusText = document.getElementById('status-text');

    // Helper: Format Speed Label
    function updateSpeedDisplay(val) {
        if (val <= 35) {
            speedLabel.textContent = `${val} ms (Fast Typer ~90 WPM)`;
        } else if (val <= 75) {
            speedLabel.textContent = `${val} ms (Realistic Human ~55 WPM)`;
        } else {
            speedLabel.textContent = `${val} ms (Deliberate Typing ~35 WPM)`;
        }
    }

    // Helper: Format Typo Label
    function updateTypoDisplay(val) {
        if (val === 0) {
            typoLabel.textContent = '0% (No typos - flawless typing)';
        } else if (val <= 4) {
            typoLabel.textContent = `${val}% (Realistic typos & backspace fixes)`;
        } else {
            typoLabel.textContent = `${val}% (Frequent typos & backspace fixes)`;
        }
    }

    // Load Saved Settings from Extension Storage
    ext.storage.local.get(['pasteEnabled', 'typingPasteEnabled', 'typingSpeed', 'typoRate'], res => {
        const pasteEnabled = res.pasteEnabled !== undefined ? res.pasteEnabled : true;
        const typingPasteEnabled = res.typingPasteEnabled !== undefined ? res.typingPasteEnabled : false;
        const typingSpeed = res.typingSpeed !== undefined ? res.typingSpeed : 65;
        const typoRatePercent = res.typoRate !== undefined ? Math.round(res.typoRate * 100) : 4;

        togglePasteEnable.checked = pasteEnabled;
        toggleTypingPaste.checked = typingPasteEnabled;
        sliderSpeed.value = typingSpeed;
        sliderTypo.value = typoRatePercent;

        updateSpeedDisplay(typingSpeed);
        updateTypoDisplay(typoRatePercent);
        updateGlobalStatus(pasteEnabled, typingPasteEnabled);
    });

    function updateGlobalStatus(pasteOn, typingOn) {
        if (typingOn) {
            statusText.textContent = 'Typing Active';
            globalStatusPill.style.color = '#34d399';
            globalStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        } else if (pasteOn) {
            statusText.textContent = 'Paste Active';
            globalStatusPill.style.color = '#c084fc';
            globalStatusPill.style.borderColor = 'rgba(139, 92, 246, 0.4)';
        } else {
            statusText.textContent = 'Paused';
            globalStatusPill.style.color = '#94a3b8';
            globalStatusPill.style.borderColor = 'rgba(148, 163, 184, 0.3)';
        }
    }

    // Event Listeners for Primary Switch 1: Paste Enable
    togglePasteEnable.addEventListener('change', () => {
        const isChecked = togglePasteEnable.checked;
        ext.storage.local.set({ pasteEnabled: isChecked });
        updateGlobalStatus(isChecked, toggleTypingPaste.checked);
    });

    // Event Listeners for Primary Switch 2: Typing Paste
    toggleTypingPaste.addEventListener('change', () => {
        const isChecked = toggleTypingPaste.checked;
        ext.storage.local.set({ typingPasteEnabled: isChecked });
        updateGlobalStatus(togglePasteEnable.checked, isChecked);
    });

    // Slider Listeners
    sliderSpeed.addEventListener('input', () => {
        const val = parseInt(sliderSpeed.value, 10);
        updateSpeedDisplay(val);
        ext.storage.local.set({ typingSpeed: val });
    });

    sliderTypo.addEventListener('input', () => {
        const val = parseInt(sliderTypo.value, 10);
        updateTypoDisplay(val);
        ext.storage.local.set({ typoRate: val / 100 });
    });

    // Query Active Tab
    async function getActiveTab() {
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        return tabs[0];
    }

    // Refresh Live Tab Telemetry
    async function refreshTelemetry() {
        try {
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'GET_PAGE_STATS' }, res => {
                if (chrome.runtime.lastError || !res || !res.stats) return;
                const s = res.stats;
                statAce.textContent = s.aceEditorsUnlocked || 0;
                statPasteBlocked.textContent = (s.pasteBlocksNeutralized || 0) + (s.contextMenuBlocksNeutralized || 0);
                statOtherEditors.textContent = (s.monacoEditorsUnlocked || 0) + (s.codeMirrorEditorsUnlocked || 0);
                statTypingState.textContent = s.humanTypingActive ? 'Typing...' : 'Idle';
                statTypingState.style.color = s.humanTypingActive ? '#34d399' : '#60a5fa';
            });
        } catch (e) {}
    }

    refreshTelemetry();
    setInterval(refreshTelemetry, 800);

    // Button Feedback Helper
    function flashButton(btn, text, origHTML, duration = 1200) {
        btn.textContent = text;
        setTimeout(() => {
            btn.innerHTML = origHTML;
            refreshTelemetry();
        }, duration);
    }

    // Action: Paste (Alt+V)
    btnForcePaste.addEventListener('click', async () => {
        const orig = btnForcePaste.innerHTML;
        const tab = await getActiveTab();
        if (!tab || !tab.id) return;

        ext.tabs.sendMessage(tab.id, { action: 'FORCE_PASTE' }, res => {
            if (res && res.success) {
                flashButton(btnForcePaste, '✅ Done!', orig);
            } else {
                flashButton(btnForcePaste, '⚠️ Focus target first', orig);
            }
        });
    });

    // Action: Human Type (Alt+Shift+V)
    btnHumanType.addEventListener('click', async () => {
        const orig = btnHumanType.innerHTML;
        const tab = await getActiveTab();
        if (!tab || !tab.id) return;

        ext.tabs.sendMessage(tab.id, { action: 'HUMAN_TYPING_PASTE' }, res => {
            if (res && res.success) {
                flashButton(btnHumanType, '⌨️ Typing...', orig);
            } else {
                flashButton(btnHumanType, '⚠️ Focus target first', orig);
            }
        });
    });

    // Action: Stop Typing (Esc)
    btnStopTyping.addEventListener('click', async () => {
        const orig = btnStopTyping.innerHTML;
        const tab = await getActiveTab();
        if (!tab || !tab.id) return;

        ext.tabs.sendMessage(tab.id, { action: 'STOP_TYPING' }, () => {
            flashButton(btnStopTyping, '🛑 Stopped', orig);
        });
    });

    // Action: Unlock Page & Editors (Alt+U)
    btnUnlockAll.addEventListener('click', async () => {
        const orig = btnUnlockAll.innerHTML;
        const tab = await getActiveTab();
        if (!tab || !tab.id) return;

        ext.tabs.sendMessage(tab.id, { action: 'TRIGGER_UNLOCK_ALL' }, () => {
            flashButton(btnUnlockAll, '⚡ Unlocked!', orig);
        });
    });
});
