/**
 * tests/remoteServer.test.js
 *
 * Comprehensive tests for src/utils/remoteServer.js:
 *   • Lifecycle (startServer, stopServer, getStatus)
 *   • WebSocket client connection & greeting ('hello')
 *   • Connected client tracking (0 -> 1 -> 2 -> 0)
 *   • Message routing: 'inject' (paste and type modes)
 *   • Message routing: 'ping' -> 'pong'
 *   • Error handling & edge cases:
 *       - Invalid JSON string
 *       - Non-object JSON (null, array, primitive)
 *       - Missing or whitespace-only text
 *       - Unknown message type
 *       - Inject function failure safety
 *   • Clean shutdown and reconnection
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Module = require('module');
const { WebSocket } = require('ws');

// ─── Module Stubbing ─────────────────────────────────────────────────────────
// remoteServer.js requires remoteTyping.js, which requires 'electron'.
// We intercept both electron and remoteTyping to isolate and inspect server behavior.

const injectedCalls = [];
let injectShouldThrow = false;

const _origResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === 'electron') return '__stub_electron_server__';
    if (request === './remoteTyping' || request.endsWith('remoteTyping')) return '__stub_remote_typing__';
    return _origResolve(request, parent, isMain, options);
};

require.cache['__stub_electron_server__'] = {
    id: '__stub_electron_server__',
    filename: '__stub_electron_server__',
    loaded: true,
    exports: {
        clipboard: {
            writeText() {},
            readText() {
                return '';
            },
        },
    },
};

require.cache['__stub_remote_typing__'] = {
    id: '__stub_remote_typing__',
    filename: '__stub_remote_typing__',
    loaded: true,
    exports: {
        injectText(text, mode, delay) {
            if (injectShouldThrow) {
                throw new Error('Simulated injection failure');
            }
            injectedCalls.push({ text, mode, delay });
        },
    },
};

const remoteServer = require('../src/utils/remoteServer');

const TEST_PORT = 59444;

function createClient(port = TEST_PORT) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        const messages = [];

        ws.on('open', () => resolve({ ws, messages }));
        ws.on('error', reject);
        ws.on('message', raw => {
            try {
                messages.push(JSON.parse(raw.toString()));
            } catch (_) {
                messages.push(raw.toString());
            }
        });
    });
}

function waitForMessage(messages, predicate, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const found = messages.find(predicate);
            if (found) return resolve(found);
            if (Date.now() - start > timeoutMs) {
                return reject(new Error('Timeout waiting for message matching predicate'));
            }
            setTimeout(check, 25);
        };
        check();
    });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test('remoteServer: startServer launches and getStatus reflects running state', () => {
    remoteServer.stopServer();
    assert.strictEqual(remoteServer.getStatus().running, false);

    const info = remoteServer.startServer(TEST_PORT);
    assert.strictEqual(info.port, TEST_PORT);
    assert.ok(Array.isArray(info.wsUrls) && info.wsUrls.length > 0);

    const status = remoteServer.getStatus();
    assert.strictEqual(status.running, true);
    assert.strictEqual(status.port, TEST_PORT);
    assert.strictEqual(status.connectedClients, 0);
});

test('remoteServer: client receives hello handshake upon connection', async () => {
    const { ws, messages } = await createClient();
    try {
        const hello = await waitForMessage(messages, m => m.type === 'hello');
        assert.strictEqual(hello.type, 'hello');
        assert.strictEqual(hello.version, '1.0');
        assert.strictEqual(remoteServer.getStatus().connectedClients, 1);
    } finally {
        ws.close();
    }
});

test('remoteServer: tracks multiple concurrent clients and updates on close', async () => {
    const client1 = await createClient();
    const client2 = await createClient();

    try {
        await waitForMessage(client1.messages, m => m.type === 'hello');
        await waitForMessage(client2.messages, m => m.type === 'hello');
        assert.strictEqual(remoteServer.getStatus().connectedClients, 2);

        client1.ws.close();
        await new Promise(r => setTimeout(r, 100));
        assert.strictEqual(remoteServer.getStatus().connectedClients, 1);
    } finally {
        client1.ws.terminate();
        client2.ws.terminate();
        await new Promise(r => setTimeout(r, 100));
    }
});

test('remoteServer: injects text in paste mode and returns ack ok', async () => {
    injectedCalls.length = 0;
    injectShouldThrow = false;

    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send(
            JSON.stringify({
                type: 'inject',
                text: 'Hello from Remote Companion',
                mode: 'paste',
            })
        );

        const ack = await waitForMessage(messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'ok');
        assert.strictEqual(ack.message, 'Injected (paste)');

        assert.strictEqual(injectedCalls.length, 1);
        assert.strictEqual(injectedCalls[0].text, 'Hello from Remote Companion');
        assert.strictEqual(injectedCalls[0].mode, 'paste');
        assert.strictEqual(injectedCalls[0].delay, 30); // default
    } finally {
        ws.close();
    }
});

test('remoteServer: injects text in type mode with custom delay and returns ack ok', async () => {
    injectedCalls.length = 0;
    injectShouldThrow = false;

    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send(
            JSON.stringify({
                type: 'inject',
                text: 'Stealth typing payload',
                mode: 'type',
                delay: 75,
            })
        );

        const ack = await waitForMessage(messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'ok');
        assert.strictEqual(ack.message, 'Injected (type)');

        assert.strictEqual(injectedCalls.length, 1);
        assert.strictEqual(injectedCalls[0].text, 'Stealth typing payload');
        assert.strictEqual(injectedCalls[0].mode, 'type');
        assert.strictEqual(injectedCalls[0].delay, 75);
    } finally {
        ws.close();
    }
});

test('remoteServer: handles client ping with pong response', async () => {
    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send(JSON.stringify({ type: 'ping' }));

        const pong = await waitForMessage(messages, m => m.type === 'pong');
        assert.strictEqual(pong.type, 'pong');
    } finally {
        ws.close();
    }
});

test('remoteServer edge case: returns error on invalid JSON syntax', async () => {
    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send('{ invalid json :::');

        const ack = await waitForMessage(messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'error');
        assert.strictEqual(ack.message, 'Invalid JSON');
    } finally {
        ws.close();
    }
});

test('remoteServer edge case: returns error on null or non-object JSON payloads', async () => {
    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send('null');
        const ack1 = await waitForMessage(messages, m => m.type === 'ack' && m.message === 'Invalid message payload');
        assert.strictEqual(ack1.status, 'error');

        ws.send('"just a string"');
        const ack2 = await waitForMessage(messages, m => m.type === 'ack' && m.message === 'Invalid message payload');
        assert.strictEqual(ack2.status, 'error');
    } finally {
        ws.close();
    }
});

test('remoteServer edge case: rejects empty or whitespace-only text', async () => {
    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send(JSON.stringify({ type: 'inject', text: '   \n  \t  ' }));

        const ack = await waitForMessage(messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'error');
        assert.strictEqual(ack.message, 'Empty text');
    } finally {
        ws.close();
    }
});

test('remoteServer edge case: handles unknown message types gracefully', async () => {
    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send(JSON.stringify({ type: 'unknown_command_action' }));

        const ack = await waitForMessage(messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'error');
        assert.ok(ack.message.includes('Unknown message type'));
    } finally {
        ws.close();
    }
});

test('remoteServer edge case: catches errors thrown by injectText safely without crashing', async () => {
    injectShouldThrow = true;
    const { ws, messages } = await createClient();
    try {
        await waitForMessage(messages, m => m.type === 'hello');

        ws.send(JSON.stringify({ type: 'inject', text: 'crash test', mode: 'paste' }));

        const ack = await waitForMessage(messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'error');
        assert.strictEqual(ack.message, 'Simulated injection failure');
        assert.strictEqual(remoteServer.getStatus().running, true);
    } finally {
        injectShouldThrow = false;
        ws.close();
    }
});

test('remoteServer: restarting server on new port stops existing server cleanly', async () => {
    const NEW_PORT = 59445;
    remoteServer.startServer(NEW_PORT);
    assert.strictEqual(remoteServer.getStatus().port, NEW_PORT);

    const { ws, messages } = await createClient(NEW_PORT);
    try {
        const hello = await waitForMessage(messages, m => m.type === 'hello');
        assert.strictEqual(hello.type, 'hello');
    } finally {
        ws.close();
        remoteServer.stopServer();
        assert.strictEqual(remoteServer.getStatus().running, false);
    }
});

// ─── Room Relay Tests (User 1 <-> User 2 Peer Communication) ─────────────────

test('remoteServer: allows clients to join a room and broadcasts room_state', async () => {
    remoteServer.startServer(TEST_PORT);
    const client1 = await createClient();

    try {
        await waitForMessage(client1.messages, m => m.type === 'hello');

        client1.ws.send(JSON.stringify({ type: 'join', room: 'ROOM-ALPHA' }));

        const roomState1 = await waitForMessage(client1.messages, m => m.type === 'room_state');
        assert.strictEqual(roomState1.room, 'ROOM-ALPHA');
        assert.strictEqual(roomState1.peersCount, 1);

        // Second client joins same room
        const client2 = await createClient();
        try {
            await waitForMessage(client2.messages, m => m.type === 'hello');
            client2.ws.send(JSON.stringify({ type: 'join', room: 'ROOM-ALPHA' }));

            // Both clients should receive updated peer count 2
            const client2State = await waitForMessage(client2.messages, m => m.type === 'room_state' && m.peersCount === 2);
            assert.strictEqual(client2State.room, 'ROOM-ALPHA');
            assert.strictEqual(client2State.peersCount, 2);

            const client1Updated = await waitForMessage(client1.messages, m => m.type === 'room_state' && m.peersCount === 2);
            assert.strictEqual(client1Updated.peersCount, 2);
        } finally {
            client2.ws.close();
        }
    } finally {
        client1.ws.close();
        remoteServer.stopServer();
    }
});

test('remoteServer: User 2 relays text to User 1 across the room', async () => {
    remoteServer.startServer(TEST_PORT);
    const user1 = await createClient(); // Receiver (e.g. test taker)
    const user2 = await createClient(); // Sender (e.g. helper)

    try {
        await waitForMessage(user1.messages, m => m.type === 'hello');
        await waitForMessage(user2.messages, m => m.type === 'hello');

        user1.ws.send(JSON.stringify({ type: 'join', room: 'TEST-ROOM' }));
        user2.ws.send(JSON.stringify({ type: 'join', room: 'TEST-ROOM' }));

        await waitForMessage(user1.messages, m => m.type === 'room_state' && m.peersCount === 2);
        await waitForMessage(user2.messages, m => m.type === 'room_state' && m.peersCount === 2);

        // User 2 sends text intended for User 1
        user2.ws.send(
            JSON.stringify({
                type: 'relay',
                text: 'function solve() { return 42; }',
                mode: 'type',
                delay: 50,
            })
        );

        // User 2 gets confirmation
        const user2Ack = await waitForMessage(user2.messages, m => m.type === 'ack' && m.recipients === 1);
        assert.strictEqual(user2Ack.status, 'ok');

        // User 1 receives the remote_inject payload
        const received = await waitForMessage(user1.messages, m => m.type === 'remote_inject');
        assert.strictEqual(received.text, 'function solve() { return 42; }');
        assert.strictEqual(received.mode, 'type');
        assert.strictEqual(received.delay, 50);

        // User 1 sends receipt back
        user1.ws.send(
            JSON.stringify({
                type: 'relay_ack',
                status: 'ok',
                message: 'Injected into Monaco editor',
            })
        );

        // User 2 receives the delivery receipt
        const peerAck = await waitForMessage(user2.messages, m => m.type === 'peer_ack');
        assert.strictEqual(peerAck.status, 'ok');
        assert.strictEqual(peerAck.message, 'Injected into Monaco editor');
    } finally {
        user1.ws.close();
        user2.ws.close();
        remoteServer.stopServer();
    }
});

test('remoteServer edge case: rejects relay attempt if client has not joined a room', async () => {
    remoteServer.startServer(TEST_PORT);
    const client = await createClient();

    try {
        await waitForMessage(client.messages, m => m.type === 'hello');

        client.ws.send(JSON.stringify({ type: 'relay', text: 'Lost in the ether' }));

        const ack = await waitForMessage(client.messages, m => m.type === 'ack');
        assert.strictEqual(ack.status, 'error');
        assert.ok(ack.message.includes('Join a room'));
    } finally {
        client.ws.close();
        remoteServer.stopServer();
    }
});
