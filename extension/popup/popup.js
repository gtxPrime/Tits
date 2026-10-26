/**
 * TITS Extension — Popup Controller
 * Obsidian & Cyber Gold Edition
 */

const ext = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
    // Primary Switches
    const togglePasteEnable = document.getElementById('toggle-paste-enable');
    const toggleTypingPaste = document.getElementById('toggle-typing-paste');
    const toggleAutoBackspace = document.getElementById('toggle-auto-backspace');

    // Sliders & Labels
    const sliderSpeed = document.getElementById('slider-speed');
    const speedLabel = document.getElementById('speed-label');
    const sliderTypo = document.getElementById('slider-typo');
    const typoLabel = document.getElementById('typo-label');
    const settingsSummaryPill = document.getElementById('settings-summary-pill');

    // Action Buttons
    const btnForcePaste = document.getElementById('btn-force-paste');
    const btnHumanType = document.getElementById('btn-human-type');
    const btnStopTyping = document.getElementById('btn-stop-typing');
    const btnUnlockAll = document.getElementById('btn-unlock-all');

    // Status Indicator
    const globalStatusPill = document.getElementById('global-status-pill');
    const statusText = document.getElementById('status-text');

    // Remote Relay Elements
    const remoteToggleBtn = document.getElementById('remote-toggle-btn');
    const remoteBody = document.getElementById('remote-body');
    const remoteConnDot = document.getElementById('remote-conn-dot');
    const remoteUrlInput = document.getElementById('remote-url-input');
    const remoteRoomInput = document.getElementById('remote-room-input');
    const remoteGenRoomBtn = document.getElementById('remote-gen-room-btn');
    const remoteConnectBtn = document.getElementById('remote-connect-btn');
    const remotePeerBadge = document.getElementById('remote-peer-badge');
    const modePillPaste = document.getElementById('mode-paste');
    const modePillType = document.getElementById('mode-type');
    const remoteTextInput = document.getElementById('remote-text-input');
    const remoteCharCount = document.getElementById('remote-char-count');
    const remoteStatusHint = document.getElementById('remote-status-hint');
    const remoteSendBtn = document.getElementById('remote-send-btn');
    const sendBtnSubtext = document.getElementById('send-btn-subtext');
    const remoteFeedList = document.getElementById('remote-feed-list');
    const remoteCopyLogsBtn = document.getElementById('remote-copy-logs-btn');
    const remoteExportLogsBtn = document.getElementById('remote-export-logs-btn');
    const remoteClearFeedBtn = document.getElementById('remote-clear-feed-btn');

    let remoteMode = 'paste'; // 'paste' | 'type'
    let remoteOpen = true;

    // Helper: Update live settings summary pill
    function updateSettingsSummary() {
        const speed = sliderSpeed ? parseInt(sliderSpeed.value, 10) : 65;
        const typo = sliderTypo ? parseInt(sliderTypo.value, 10) : 4;
        const backspaceOn = toggleAutoBackspace ? toggleAutoBackspace.checked : true;

        if (speedLabel) speedLabel.textContent = `${speed} ms`;
        if (typoLabel) typoLabel.textContent = `${typo}%`;
        if (settingsSummaryPill) {
            settingsSummaryPill.textContent = `Speed: ${speed}ms • Typos: ${typo}% • Auto-Backspace: ${backspaceOn ? 'ON' : 'OFF'}`;
        }
        updateSendButtonLabel();
    }

    function updateSendButtonLabel() {
        if (!sendBtnSubtext) return;
        const speed = sliderSpeed ? parseInt(sliderSpeed.value, 10) : 65;
        const typo = sliderTypo ? parseInt(sliderTypo.value, 10) : 4;
        if (remoteMode === 'type') {
            sendBtnSubtext.textContent = `(${speed}ms • ${typo}% typos)`;
        } else {
            sendBtnSubtext.textContent = '(Instant Paste)';
        }
    }

    // Load Saved Settings from Extension Storage
    ext.storage.local.get(['pasteEnabled', 'typingPasteEnabled', 'typingSpeed', 'typoRate', 'autoBackspace'], res => {
        const pasteEnabled = res.pasteEnabled !== undefined ? res.pasteEnabled : true;
        const typingPasteEnabled = res.typingPasteEnabled !== undefined ? res.typingPasteEnabled : false;
        const typingSpeed = res.typingSpeed !== undefined ? res.typingSpeed : 65;
        const typoRatePercent = res.typoRate !== undefined ? Math.round(res.typoRate * 100) : 4;
        const autoBackspace = res.autoBackspace !== undefined ? res.autoBackspace : true;

        if (togglePasteEnable) togglePasteEnable.checked = pasteEnabled;
        if (toggleTypingPaste) toggleTypingPaste.checked = typingPasteEnabled;
        if (toggleAutoBackspace) toggleAutoBackspace.checked = autoBackspace;
        if (sliderSpeed) sliderSpeed.value = typingSpeed;
        if (sliderTypo) sliderTypo.value = typoRatePercent;

        updateSettingsSummary();
        updateGlobalStatus(pasteEnabled, typingPasteEnabled);
    });

    function updateGlobalStatus(pasteOn, typingOn) {
        if (!statusText || !globalStatusPill) return;
        if (typingOn) {
            statusText.textContent = 'Typing';
            globalStatusPill.className = 'status-pill active';
            globalStatusPill.style.color = '#22c55e';
            globalStatusPill.style.borderColor = 'rgba(34, 197, 94, 0.4)';
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

    // Switch Handlers
    if (togglePasteEnable) {
        togglePasteEnable.addEventListener('change', () => {
            const isChecked = togglePasteEnable.checked;
            ext.storage.local.set({ pasteEnabled: isChecked });
            updateGlobalStatus(isChecked, toggleTypingPaste ? toggleTypingPaste.checked : false);
        });
    }

    if (toggleTypingPaste) {
        toggleTypingPaste.addEventListener('change', () => {
            const isChecked = toggleTypingPaste.checked;
            ext.storage.local.set({ typingPasteEnabled: isChecked });
            updateGlobalStatus(togglePasteEnable ? togglePasteEnable.checked : true, isChecked);
        });
    }

    if (toggleAutoBackspace) {
        toggleAutoBackspace.addEventListener('change', () => {
            const isChecked = toggleAutoBackspace.checked;
            ext.storage.local.set({ autoBackspace: isChecked });
            updateSettingsSummary();
        });
    }

    // Sliders
    if (sliderSpeed) {
        sliderSpeed.addEventListener('input', () => {
            const val = parseInt(sliderSpeed.value, 10);
            ext.storage.local.set({ typingSpeed: val });
            updateSettingsSummary();
        });
    }

    if (sliderTypo) {
        sliderTypo.addEventListener('input', () => {
            const val = parseInt(sliderTypo.value, 10);
            ext.storage.local.set({ typoRate: val / 100 });
            updateSettingsSummary();
        });
    }

    // Query Active Tab
    async function getActiveTab() {
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        return tabs[0];
    }

    function flashButton(btn, text, origText, duration = 1200) {
        if (!btn) return;
        btn.textContent = text;
        setTimeout(() => {
            btn.textContent = origText;
        }, duration);
    }

    // Quick Action Deck
    if (btnForcePaste) {
        btnForcePaste.addEventListener('click', async () => {
            const orig = btnForcePaste.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'FORCE_PASTE' }, res => {
                if (res && res.success) {
                    flashButton(btnForcePaste, 'Done ✓', orig);
                } else {
                    flashButton(btnForcePaste, 'Focus first', orig);
                }
            });
        });
    }

    if (btnHumanType) {
        btnHumanType.addEventListener('click', async () => {
            const orig = btnHumanType.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'HUMAN_TYPING_PASTE' }, res => {
                if (res && res.success) {
                    flashButton(btnHumanType, 'Typing…', orig);
                } else {
                    flashButton(btnHumanType, 'Focus first', orig);
                }
            });
        });
    }

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

    if (btnUnlockAll) {
        btnUnlockAll.addEventListener('click', async () => {
            const orig = btnUnlockAll.textContent;
            const tab = await getActiveTab();
            if (!tab || !tab.id) return;

            ext.tabs.sendMessage(tab.id, { action: 'TRIGGER_UNLOCK_ALL' }, () => {
                flashButton(btnUnlockAll, 'Unlocked ✓', orig);
            });
        });
    }

    // Generate Random Room Code
    function generateRandomRoom() {
        const adjectives = ['FAST', 'NINJA', 'ALPHA', 'STEALTH', 'PRIME', 'GHOST', 'CIPHER', 'TITAN'];
        const num = Math.floor(100 + Math.random() * 900);
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${num}`;
    }

    // Restore saved remote settings
    ext.storage.local.get(['remoteWsUrl', 'remoteRoom', 'remoteMode', 'remotePanelOpen'], res => {
        if (remoteUrlInput && res.remoteWsUrl) remoteUrlInput.value = res.remoteWsUrl;
        if (remoteRoomInput) remoteRoomInput.value = res.remoteRoom || 'STEALTH-165';
        if (res.remoteMode) setMode(res.remoteMode);
        if (res.remotePanelOpen === false) collapsePanel(false);
        syncStatusWithBackground();
    });

    if (remoteGenRoomBtn) {
        remoteGenRoomBtn.addEventListener('click', () => {
            const newRoom = generateRandomRoom();
            if (remoteRoomInput) remoteRoomInput.value = newRoom;
            ext.storage.local.set({ remoteRoom: newRoom });
            setHint(`Room set to ${newRoom}`);
        });
    }

    function collapsePanel(open) {
        remoteOpen = open;
        if (remoteBody) remoteBody.style.display = open ? 'flex' : 'none';
    }

    if (remoteToggleBtn) {
        remoteToggleBtn.addEventListener('click', e => {
            if (e.target.closest('#remote-peer-badge') || e.target.closest('.remote-conn-status')) return;
            remoteOpen = !remoteOpen;
            collapsePanel(remoteOpen);
            ext.storage.local.set({ remotePanelOpen: remoteOpen });
        });
    }

    function setMode(mode) {
        remoteMode = mode;
        if (modePillPaste) modePillPaste.classList.toggle('active', mode === 'paste');
        if (modePillType) modePillType.classList.toggle('active', mode === 'type');
        ext.storage.local.set({ remoteMode: mode });
        updateSendButtonLabel();
    }

    if (modePillPaste) modePillPaste.addEventListener('click', () => setMode('paste'));
    if (modePillType) modePillType.addEventListener('click', () => setMode('type'));

    function setHint(msg, type = '') {
        if (!remoteStatusHint) return;
        remoteStatusHint.textContent = msg;
        remoteStatusHint.className = 'remote-hint' + (type ? ' ' + type : '');
    }

    // Realtime character counter
    if (remoteTextInput && remoteCharCount) {
        remoteTextInput.addEventListener('input', () => {
            const count = remoteTextInput.value.length;
            remoteCharCount.textContent = `${count} char${count === 1 ? '' : 's'}`;
        });
    }

    // Terminal Activity Feed Renderer
    function renderFeed(logs = []) {
        if (!remoteFeedList) return;
        if (!logs.length) {
            remoteFeedList.innerHTML = '<div class="feed-empty">No activity yet. Connect & share room.</div>';
            return;
        }
        remoteFeedList.innerHTML = logs
            .slice(0, 20)
            .map(log => {
                const cls = log.type || 'info';
                const tag = (log.type || 'info').toUpperCase();
                return `<div class="feed-item"><span class="feed-time">${log.time || ''}</span><span class="feed-tag ${cls}">${tag}</span><span class="feed-text">${escapeHtml(log.text)}</span></div>`;
            })
            .join('');
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function fetchFullDiagnostics() {
        return new Promise(resolve => {
            ext.runtime.sendMessage({ action: 'REMOTE_GET_DIAGNOSTICS' }, res => {
                if (res && res.success) {
                    return resolve(res);
                }
                ext.runtime.sendMessage({ action: 'REMOTE_GET_STATUS' }, statusRes => {
                    resolve({
                        success: true,
                        manifest: { name: 'TITS Companion', version: '1.2.0' },
                        remoteState: statusRes || {},
                        tabs: [],
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                    });
                });
            });
        });
    }

    function buildDiagnosticReport(diag) {
        const now = new Date();
        const state = diag.remoteState || {};
        const tabs = diag.tabs || [];
        const logs = (state.logs || []).slice().reverse();

        const speed = sliderSpeed ? parseInt(sliderSpeed.value, 10) : 65;
        const typo = sliderTypo ? parseInt(sliderTypo.value, 10) : 4;
        const unblockerOn = togglePasteEnable ? togglePasteEnable.checked : true;
        const typingPasteOn = toggleTypingPaste ? toggleTypingPaste.checked : false;
        const autoBackspaceOn = toggleAutoBackspace ? toggleAutoBackspace.checked : true;

        const lines = [
            '================================================================',
            '          TITS EXTENSION - COMPREHENSIVE DIAGNOSTIC LOG          ',
            '================================================================',
            `Export Time    : ${now.toISOString()} (${now.toLocaleTimeString()})`,
            `Extension      : ${diag.manifest?.name || 'TITS'} v${diag.manifest?.version || '1.2.0'}`,
            `Browser / OS   : ${diag.userAgent || navigator.userAgent}`,
            '',
            '--- [RELAY CONNECTION STATUS] ---',
            `Relay State    : ${state.status || 'disconnected'} (Connected: ${state.connected ?? state.status === 'connected'})`,
            `WebSocket URL  : ${state.url || remoteUrlInput?.value || 'ws://127.0.0.1:59432'}`,
            `Room Code      : ${state.room || remoteRoomInput?.value || 'ROOM-1'}`,
            `Client ID      : ${state.clientId || 'none'}`,
            `Peer Count     : ${state.peersCount ?? 0}`,
            `Connection Tip : ${state.peersCount > 1 ? 'PAIRED (Ready: 2+ browser instances in room)' : 'WAITING (Need 2nd browser to join room "' + (state.room || 'ROOM-1') + '")'}`,
            '',
            '--- [SETTINGS & MODES] ---',
            `Selected Mode  : ${remoteMode || 'paste'}`,
            `Typing Speed   : ${speed} ms/char`,
            `Typo Rate      : ${typo}%`,
            `Auto-Backspace : ${autoBackspaceOn ? 'ENABLED (Typo auto-corrected)' : 'DISABLED'}`,
            `Remote Link    : LINKED (Settings transmitted over relay packet)`,
            `Unblocker Alt+V: ${unblockerOn ? 'ENABLED' : 'DISABLED'}`,
            `Typing Alt+Sh+V: ${typingPasteOn ? 'ENABLED' : 'DISABLED'}`,
            '',
            '--- [DETECTED BROWSER TABS] ---',
            tabs.length === 0
                ? 'No tabs enumerated.'
                : tabs
                      .map((t, idx) => {
                          const activeMark = t.active ? '[ACTIVE] ' : '';
                          return `Tab #${idx + 1} (ID: ${t.id}) ${activeMark}\n  URL  : ${t.url}\n  Title: ${t.title || '(no title)'}`;
                      })
                      .join('\n\n'),
            '',
            '--- [CHRONOLOGICAL ACTIVITY & ERROR LOGS] ---',
            logs.length === 0
                ? 'No events logged.'
                : logs
                      .map(l => {
                          const t = l.time || '??:??:??';
                          const tag = (l.type || 'info').toUpperCase().padEnd(4);
                          return `[${t}] [${tag}] ${l.text}`;
                      })
                      .join('\n'),
            '',
            '================================================================',
            '                         END OF LOGS                            ',
            '================================================================',
        ];

        return lines.join('\n');
    }

    async function copyReportToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (_) {}
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (_) {}
        document.body.removeChild(ta);
        return ok;
    }

    if (remoteCopyLogsBtn) {
        remoteCopyLogsBtn.addEventListener('click', async () => {
            const orig = remoteCopyLogsBtn.textContent;
            remoteCopyLogsBtn.textContent = 'Gathering…';
            const diag = await fetchFullDiagnostics();
            const report = buildDiagnosticReport(diag);
            const ok = await copyReportToClipboard(report);

            if (ok) {
                remoteCopyLogsBtn.textContent = 'Copied! ✓';
                remoteCopyLogsBtn.classList.add('copied');
                setHint('Logs copied! Paste into chat.', 'ok');
            } else {
                remoteCopyLogsBtn.textContent = 'Failed ✗';
                setHint('Clipboard write failed', 'err');
            }

            setTimeout(() => {
                remoteCopyLogsBtn.textContent = orig;
                remoteCopyLogsBtn.classList.remove('copied');
            }, 2500);
        });
    }

    if (remoteExportLogsBtn) {
        remoteExportLogsBtn.addEventListener('click', async () => {
            const orig = remoteExportLogsBtn.textContent;
            remoteExportLogsBtn.textContent = 'Exporting…';
            const diag = await fetchFullDiagnostics();
            const report = buildDiagnosticReport(diag);

            try {
                const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                a.download = `tits-diagnostics-${dateStr}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);

                remoteExportLogsBtn.textContent = 'Saved! ✓';
                remoteExportLogsBtn.classList.add('copied');
                setHint('Saved report to file', 'ok');
            } catch (err) {
                remoteExportLogsBtn.textContent = 'Error ✗';
                setHint(`Export failed: ${err.message}`, 'err');
            }

            setTimeout(() => {
                remoteExportLogsBtn.textContent = orig;
                remoteExportLogsBtn.classList.remove('copied');
            }, 2500);
        });
    }

    if (remoteClearFeedBtn) {
        remoteClearFeedBtn.addEventListener('click', () => {
            ext.runtime.sendMessage({ action: 'REMOTE_CLEAR_LOGS' }, () => {
                if (remoteFeedList) remoteFeedList.innerHTML = '<div class="feed-empty">Feed cleared.</div>';
                setHint('Logs cleared');
            });
        });
    }

    function syncStatusWithBackground() {
        ext.runtime.sendMessage({ action: 'REMOTE_GET_STATUS' }, res => {
            if (!res) return;

            const isConnected = res.connected;
            const peers = res.peersCount || 0;

            if (remoteConnDot) {
                remoteConnDot.className = 'remote-conn-status' + (isConnected ? (peers > 1 ? ' connected' : ' connecting') : '');
            }

            if (remoteConnectBtn) {
                if (isConnected) {
                    remoteConnectBtn.textContent = 'Disconnect';
                    remoteConnectBtn.classList.add('disconnect');
                } else if (res.status === 'connecting') {
                    remoteConnectBtn.textContent = 'Connecting…';
                    remoteConnectBtn.classList.remove('disconnect');
                } else {
                    remoteConnectBtn.textContent = 'Connect';
                    remoteConnectBtn.classList.remove('disconnect');
                }
            }

            if (remoteSendBtn) {
                remoteSendBtn.disabled = !isConnected;
            }

            if (remotePeerBadge) {
                if (!isConnected) {
                    remotePeerBadge.textContent = 'Offline';
                    remotePeerBadge.className = 'remote-peer-badge';
                } else if (peers > 1) {
                    remotePeerBadge.textContent = `🟢 ${peers} Peers Live`;
                    remotePeerBadge.className = 'remote-peer-badge live';
                } else {
                    remotePeerBadge.textContent = `🟡 Solo in Room`;
                    remotePeerBadge.className = 'remote-peer-badge solo';
                }
            }

            if (isConnected) {
                setHint(
                    peers > 1 ? `Room ${res.room || 'LIVE'}: Paired & ready ✓` : `Room ${res.room || 'LIVE'}: Waiting for peer`,
                    peers > 1 ? 'ok' : ''
                );
            } else if (res.status === 'connecting') {
                setHint('Connecting to server…');
            } else {
                setHint('Not connected');
            }

            renderFeed(res.logs);
        });
    }

    if (remoteConnectBtn) {
        remoteConnectBtn.addEventListener('click', () => {
            ext.runtime.sendMessage({ action: 'REMOTE_GET_STATUS' }, res => {
                if (res && res.connected) {
                    ext.runtime.sendMessage({ action: 'REMOTE_DISCONNECT' }, () => syncStatusWithBackground());
                } else {
                    const url = (remoteUrlInput.value || '').trim();
                    const room = (remoteRoomInput.value || '').trim();
                    if (!url) {
                        setHint('Enter Server URL', 'err');
                        return;
                    }
                    if (!room) {
                        setHint('Enter Room Code', 'err');
                        return;
                    }
                    setHint('Connecting…');
                    ext.runtime.sendMessage({ action: 'REMOTE_CONNECT', url, room }, () => {
                        syncStatusWithBackground();
                    });
                }
            });
        });
    }

    function sendRemoteText() {
        const text = remoteTextInput.value;
        if (!text.trim()) {
            setHint('Nothing to send', 'err');
            return;
        }

        const speed = sliderSpeed ? parseInt(sliderSpeed.value, 10) : 65;
        const typo = sliderTypo ? parseInt(sliderTypo.value, 10) : 4;
        const autoBackspace = toggleAutoBackspace ? toggleAutoBackspace.checked : true;

        setHint('Sending…');

        ext.runtime.sendMessage(
            {
                action: 'REMOTE_SEND',
                text,
                mode: remoteMode,
                delay: speed,
                typoRate: typo,
                autoBackspace: autoBackspace,
            },
            res => {
                if (res && res.success) {
                    setHint(`Sent ✓ (${res.recipients} peer received)`, 'ok');
                    remoteTextInput.value = '';
                    if (remoteCharCount) remoteCharCount.textContent = '0 chars';
                    syncStatusWithBackground();
                } else {
                    setHint(`Error: ${res?.error || 'Send failed'}`, 'err');
                }
            }
        );
    }

    if (remoteSendBtn) {
        remoteSendBtn.addEventListener('click', sendRemoteText);
    }

    if (remoteTextInput) {
        remoteTextInput.addEventListener('keydown', e => {
            if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey)) || (e.key === 'Enter' && e.altKey)) {
                e.preventDefault();
                sendRemoteText();
            }
        });
    }

    // Poll status periodically while popup is open
    const statusInterval = setInterval(syncStatusWithBackground, 1500);
    window.addEventListener('unload', () => clearInterval(statusInterval));
});
