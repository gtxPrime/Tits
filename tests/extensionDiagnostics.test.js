const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Extension Diagnostics & Export Report Suite', () => {
    function buildDiagnosticReport(diag, settings = {}) {
        const now = new Date();
        const state = diag.remoteState || {};
        const tabs = diag.tabs || [];
        const logs = (state.logs || []).slice().reverse(); // Chronological order (oldest to newest)

        const speed = settings.speed || 65;
        const typo = settings.typo || 4;
        const unblockerOn = settings.unblocker ?? true;
        const typingPasteOn = settings.typingPaste ?? false;

        const lines = [
            '================================================================',
            '          TITS EXTENSION - COMPREHENSIVE DIAGNOSTIC LOG          ',
            '================================================================',
            `Export Time    : ${now.toISOString()} (${now.toLocaleTimeString()})`,
            `Extension      : ${diag.manifest?.name || 'TITS'} v${diag.manifest?.version || '1.0.0'}`,
            `Browser / OS   : ${diag.userAgent || 'Node/Test'}`,
            '',
            '--- [RELAY CONNECTION STATUS] ---',
            `Relay State    : ${state.status || 'disconnected'} (Connected: ${state.connected ?? state.status === 'connected'})`,
            `WebSocket URL  : ${state.url || 'ws://127.0.0.1:59432'}`,
            `Room Code      : ${state.room || 'ROOM-1'}`,
            `Client ID      : ${state.clientId || 'none'}`,
            `Peer Count     : ${state.peersCount ?? 0}`,
            `Connection Tip : ${state.peersCount > 1 ? 'PAIRED (Ready: 2+ browser instances in room)' : 'WAITING (Need 2nd browser to join room "' + (state.room || 'ROOM-1') + '")'}`,
            '',
            '--- [SETTINGS & MODES] ---',
            `Selected Mode  : ${settings.mode || 'paste'}`,
            `Typing Speed   : ${speed} ms/char`,
            `Typo Rate      : ${typo}%`,
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

    test('generates comprehensive report with all sections present', () => {
        const diag = {
            manifest: { name: 'TITS Companion', version: '2.4.0' },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0',
            remoteState: {
                status: 'connected',
                connected: true,
                url: 'ws://192.168.1.6:59432',
                room: 'STEALTH-165',
                clientId: 'peer_abc123',
                peersCount: 2,
                logs: [
                    { time: '03:01:44 AM', type: 'recv', text: 'Received 22 chars [paste] from peer' },
                    { time: '03:01:36 AM', type: 'ok', text: 'Connected to server. Joining room STEALTH-165...' },
                ],
            },
            tabs: [
                { id: 555627514, active: true, windowId: 1, url: 'https://leetcode.com/problems/test', title: 'LeetCode Problem' },
                { id: 555627515, active: false, windowId: 1, url: 'chrome://extensions', title: 'Extensions' },
            ],
        };

        const settings = {
            mode: 'paste',
            speed: 65,
            typo: 4,
            unblocker: true,
            typingPaste: false,
        };

        const report = buildDiagnosticReport(diag, settings);

        assert.ok(report.includes('TITS Companion v2.4.0'));
        assert.ok(report.includes('ws://192.168.1.6:59432'));
        assert.ok(report.includes('STEALTH-165'));
        assert.ok(report.includes('peer_abc123'));
        assert.ok(report.includes('PAIRED (Ready: 2+ browser instances in room)'));
        assert.ok(report.includes('[ACTIVE]'));
        assert.ok(report.includes('https://leetcode.com/problems/test'));
        // Chronological order: 03:01:36 AM (oldest) should appear before 03:01:44 AM (newest)
        const idxFirst = report.indexOf('03:01:36 AM');
        const idxSecond = report.indexOf('03:01:44 AM');
        assert.ok(idxFirst > 0 && idxSecond > 0 && idxFirst < idxSecond, 'Logs should be in chronological order');
        assert.ok(report.includes('[RECV]'));
        assert.ok(report.includes('Received 22 chars [paste] from peer'));
    });

    test('handles empty logs and missing tabs gracefully', () => {
        const diag = {
            manifest: null,
            userAgent: null,
            remoteState: {
                status: 'disconnected',
                peersCount: 0,
                logs: [],
            },
            tabs: [],
        };

        const report = buildDiagnosticReport(diag);

        assert.ok(report.includes('No tabs enumerated.'));
        assert.ok(report.includes('No events logged.'));
        assert.ok(report.includes('WAITING (Need 2nd browser to join room "ROOM-1")'));
        assert.ok(report.includes('END OF LOGS'));
    });
});
