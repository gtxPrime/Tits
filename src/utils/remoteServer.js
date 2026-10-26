/**
 * remoteServer.js
 * WebSocket server for the Remote Extension feature.
 * Listens on a local port; the extension connects directly via the LAN IP shown in Settings.
 *
 * Protocol (JSON over WebSocket):
 *   Client → Server:  { type: 'inject', text: '...', mode: 'paste'|'type', delay: 30 }
 *   Server → Client:  { type: 'ack', status: 'ok'|'error', message: '...' }
 *   Server → Client:  { type: 'ping' }   (keepalive every 20 s)
 */

const { WebSocketServer } = require('ws');
const os = require('os');
const { injectText } = require('./remoteTyping');
const debugLogger = require('./debugLogger');

const DEFAULT_PORT = 59_432; // arbitrary fixed port unlikely to conflict

/** @type {WebSocketServer|null} */
let wss = null;
/** @type {NodeJS.Timer|null} */
let pingTimer = null;
let currentPort = DEFAULT_PORT;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Return all non-loopback IPv4 addresses. */
function getLanAddresses() {
    const interfaces = os.networkInterfaces();
    const addrs = [];
    for (const iface of Object.values(interfaces)) {
        for (const entry of iface ?? []) {
            if (entry.family === 'IPv4' && !entry.internal) {
                addrs.push(entry.address);
            }
        }
    }
    return addrs;
}

function safeSend(ws, payload) {
    if (ws && ws.readyState === ws.OPEN) {
        try {
            ws.send(JSON.stringify(payload));
        } catch (_) {}
    }
}

// ─── room management ──────────────────────────────────────────────────────────
/** @type {Map<string, Set<any>>} roomCode -> Set of ws */
const rooms = new Map();

function broadcastToRoom(roomCode, payload, excludeWs = null) {
    const peers = rooms.get(roomCode);
    if (!peers) return 0;
    let count = 0;
    for (const peer of peers) {
        if (peer !== excludeWs && peer.readyState === peer.OPEN) {
            safeSend(peer, payload);
            count++;
        }
    }
    return count;
}

function leaveRoom(ws) {
    if (!ws.room) return;
    const roomCode = ws.room;
    const peers = rooms.get(roomCode);
    if (peers) {
        peers.delete(ws);
        if (peers.size === 0) {
            rooms.delete(roomCode);
        } else {
            broadcastToRoom(roomCode, {
                type: 'room_state',
                room: roomCode,
                peersCount: peers.size,
            });
        }
    }
    ws.room = null;
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Start the WebSocket server.
 * @param {number} [port] Override port (default 59432).
 * @returns {{ port: number, wsUrls: string[] }}
 */
function startServer(port = DEFAULT_PORT) {
    if (wss) stopServer();

    currentPort = port;
    rooms.clear();

    wss = new WebSocketServer({ port: currentPort });

    wss.on('connection', (ws, req) => {
        const clientIp = req?.socket?.remoteAddress ?? 'unknown';
        ws._clientId = `peer_${Math.random().toString(36).slice(2, 8)}`;
        debugLogger.info('Remote', `Extension connected from ${clientIp} (${ws._clientId})`);

        // Immediately greet with server info
        safeSend(ws, { type: 'hello', version: '1.0', clientId: ws._clientId });

        ws.on('message', raw => {
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            } catch {
                safeSend(ws, { type: 'ack', status: 'error', message: 'Invalid JSON' });
                return;
            }

            if (!msg || typeof msg !== 'object') {
                safeSend(ws, { type: 'ack', status: 'error', message: 'Invalid message payload' });
                return;
            }

            if (msg.type === 'ping') {
                safeSend(ws, { type: 'pong' });
                return;
            }

            // Join a Room (e.g. { type: 'join', room: 'ABC12' })
            if (msg.type === 'join') {
                const roomCode = String(msg.room || 'DEFAULT')
                    .trim()
                    .toUpperCase();
                if (ws.room !== roomCode) {
                    leaveRoom(ws);
                }
                if (!rooms.has(roomCode)) {
                    rooms.set(roomCode, new Set());
                }
                const peerSet = rooms.get(roomCode);
                peerSet.add(ws);
                ws.room = roomCode;

                debugLogger.info('Remote', `Client ${ws._clientId} joined room ${roomCode} (${peerSet.size} peers)`);

                // Notify all peers in the room of updated peer count
                for (const peer of peerSet) {
                    safeSend(peer, {
                        type: 'room_state',
                        room: roomCode,
                        peersCount: peerSet.size,
                    });
                }

                safeSend(ws, {
                    type: 'ack',
                    status: 'ok',
                    message: `Joined room ${roomCode}`,
                    room: roomCode,
                    peersCount: peerSet.size,
                });
                return;
            }

            // Relay text to peers in the same room (User 2 -> User 1)
            if (msg.type === 'relay') {
                const targetRoom = ws.room || (typeof msg.room === 'string' ? msg.room.trim().toUpperCase() : null);
                if (!targetRoom || !rooms.has(targetRoom)) {
                    safeSend(ws, { type: 'ack', status: 'error', message: 'Join a room before sending text' });
                    return;
                }

                const text = typeof msg.text === 'string' ? msg.text : '';
                const mode = msg.mode === 'type' ? 'type' : 'paste';
                const delay = typeof msg.delay === 'number' && !Number.isNaN(msg.delay) ? msg.delay : 65;
                const typoRate = typeof msg.typoRate === 'number' && !Number.isNaN(msg.typoRate) ? msg.typoRate : 4;
                const autoBackspace = msg.autoBackspace !== undefined ? Boolean(msg.autoBackspace) : true;

                if (!text.trim()) {
                    safeSend(ws, { type: 'ack', status: 'error', message: 'Empty text' });
                    return;
                }

                // Broadcast to other peers in this room
                const relayedCount = broadcastToRoom(
                    targetRoom,
                    {
                        type: 'remote_inject',
                        text,
                        mode,
                        delay,
                        typoRate,
                        autoBackspace,
                        from: ws._clientId,
                        room: targetRoom,
                        timestamp: Date.now(),
                    },
                    ws
                );

                debugLogger.info('Remote', `Relayed ${text.length} chars to ${relayedCount} peer(s) in ${targetRoom}`);

                safeSend(ws, {
                    type: 'ack',
                    status: relayedCount > 0 ? 'ok' : 'warn',
                    message: relayedCount > 0 ? `Sent to ${relayedCount} peer(s)` : 'Sent (waiting for receiver to join)',
                    recipients: relayedCount,
                });
                return;
            }

            // Receiver acknowledge back to sender (User 1 -> User 2)
            if (msg.type === 'relay_ack') {
                const targetRoom = ws.room;
                if (targetRoom) {
                    broadcastToRoom(
                        targetRoom,
                        {
                            type: 'peer_ack',
                            status: msg.status || 'ok',
                            message: msg.message || 'Text injected into active tab',
                            from: ws._clientId,
                        },
                        ws
                    );
                }
                return;
            }

            // Direct desktop injection (backward compatibility)
            if (msg.type === 'inject') {
                const text = typeof msg.text === 'string' ? msg.text : '';
                const mode = msg.mode === 'type' ? 'type' : 'paste';
                const delay = typeof msg.delay === 'number' && !Number.isNaN(msg.delay) ? msg.delay : 30;

                if (!text.trim()) {
                    safeSend(ws, { type: 'ack', status: 'error', message: 'Empty text' });
                    return;
                }

                try {
                    injectText(text, mode, delay);
                    safeSend(ws, { type: 'ack', status: 'ok', message: `Injected (${mode})` });
                    debugLogger.info('Remote', `Injected ${text.length} chars via ${mode}`);
                } catch (err) {
                    safeSend(ws, { type: 'ack', status: 'error', message: err.message });
                }
                return;
            }

            // Unrecognized message type
            safeSend(ws, { type: 'ack', status: 'error', message: `Unknown message type: ${msg.type}` });
        });

        ws.on('close', () => {
            leaveRoom(ws);
            debugLogger.info('Remote', `Extension disconnected from ${clientIp}`);
        });

        ws.on('error', err => {
            debugLogger.warn('Remote', `WebSocket error: ${err.message}`);
        });
    });

    wss.on('error', err => {
        debugLogger.error('Remote', `Server error: ${err.message}`);
    });

    // Keepalive pings every 20 s
    pingTimer = setInterval(() => {
        if (!wss || !wss.clients) return;
        for (const ws of wss.clients) {
            safeSend(ws, { type: 'ping' });
        }
    }, 20_000);
    if (pingTimer.unref) pingTimer.unref();

    const lanAddrs = getLanAddresses();
    const wsUrls = lanAddrs.map(ip => `ws://${ip}:${currentPort}`);
    if (wsUrls.length === 0) wsUrls.push(`ws://127.0.0.1:${currentPort}`);

    debugLogger.info('Remote', `Server started on port ${currentPort}`, { wsUrls });
    return { port: currentPort, wsUrls };
}

/** Stop the WebSocket server and clean up. */
function stopServer() {
    if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
    }
    rooms.clear();
    if (wss) {
        for (const ws of wss.clients) {
            try {
                ws.terminate();
            } catch (_) {}
        }
        wss.close();
        wss = null;
        debugLogger.info('Remote', 'Server stopped');
    }
}

/** @returns {{ running: boolean, port: number, wsUrls: string[], connectedClients: number, roomsCount: number }} */
function getStatus() {
    const running = !!wss;
    const connectedClients = running ? wss.clients.size : 0;
    const roomsCount = running ? rooms.size : 0;
    const lanAddrs = getLanAddresses();
    const wsUrls = running ? lanAddrs.map(ip => `ws://${ip}:${currentPort}`) : [];
    if (running && wsUrls.length === 0) wsUrls.push(`ws://127.0.0.1:${currentPort}`);
    return { running, port: currentPort, wsUrls, connectedClients, roomsCount };
}

module.exports = { startServer, stopServer, getStatus };
