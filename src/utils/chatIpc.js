/**
 * Ask AI: text chat threads with Gemini using the API key saved in Settings.
 *
 * Threads are stored locally, one JSON file each, in <config dir>/chats/<id>.json
 * ({ id, title, createdAt, updatedAt, messages: [{ role: 'user' | 'model', text, at }] }).
 * The main process owns the history: every message is sent with that thread's earlier
 * messages as context. Threads can be deleted one by one or all at once from the chat page.
 * Replies stream back to the sender as 'chat:chunk' events.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ipcMain } = require('electron');
const { GoogleGenAI } = require('@google/genai');
const { getApiKey, getAvailableModel, incrementLimitCount, getConfigDir } = require('../storage');

const MAX_MESSAGE_CHARS = 32000;
const MAX_CONTEXT_CHARS = 200000; // oldest turns beyond this are left out of the request (still kept on disk)
const SYSTEM_PROMPT =
    'You are a helpful assistant in an ongoing conversation. Use the earlier messages as context. ' +
    'Answer clearly and concisely, and use Markdown for code, lists and tables when it helps.';
const ID_RE = /^[a-z0-9-]{8,64}$/;

const active = new Map(); // requestId -> { controller, threadId }
let handlersRegistered = false;

// ───────── storage ─────────

function chatsDir() {
    return path.join(getConfigDir(), 'chats');
}

function threadPath(id) {
    return path.join(chatsDir(), `${id}.json`);
}

function readThread(id) {
    if (typeof id !== 'string' || !ID_RE.test(id)) return null;
    try {
        const t = JSON.parse(fs.readFileSync(threadPath(id), 'utf8'));
        if (!t || !Array.isArray(t.messages)) return null;
        return t;
    } catch (_) {
        return null;
    }
}

function writeThread(thread) {
    fs.mkdirSync(chatsDir(), { recursive: true });
    const file = threadPath(thread.id);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(thread), 'utf8');
    fs.renameSync(tmp, file);
}

function listThreads() {
    let files = [];
    try {
        files = fs.readdirSync(chatsDir()).filter(f => f.endsWith('.json'));
    } catch (_) {
        return [];
    }
    const out = [];
    for (const f of files) {
        const t = readThread(f.slice(0, -5));
        if (t) out.push({ id: t.id, title: t.title, updatedAt: t.updatedAt, count: t.messages.length });
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

function makeTitle(text) {
    const line = text.replace(/\s+/g, ' ').trim();
    return line.length > 60 ? `${line.slice(0, 57)}…` : line || 'New chat';
}

/** Gemini contents from the thread, newest turns first within the budget, starting on a user turn. */
function buildContents(messages) {
    const out = [];
    let total = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (!m.text) continue;
        if (total + m.text.length > MAX_CONTEXT_CHARS && out.length) break;
        total += m.text.length;
        out.unshift({ role: m.role, parts: [{ text: m.text }] });
    }
    while (out.length && out[0].role !== 'user') out.shift();
    return out;
}

// ───────── IPC ─────────

function setupChatIpcHandlers() {
    if (handlersRegistered) return;
    handlersRegistered = true;

    ipcMain.handle('chat:has-key', () => ({ hasKey: Boolean(getApiKey()) }));
    ipcMain.handle('chat:list', () => listThreads());
    ipcMain.handle('chat:get', (_e, id) => readThread(id));

    ipcMain.handle('chat:delete', (_e, id) => {
        if (typeof id !== 'string' || !ID_RE.test(id)) return { success: false };
        try {
            fs.rmSync(threadPath(id), { force: true });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('chat:delete-all', () => {
        try {
            for (const t of listThreads()) fs.rmSync(threadPath(t.id), { force: true });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    ipcMain.handle('chat:send', async (event, payload) => {
        const requestId = payload && typeof payload.requestId === 'string' ? payload.requestId.slice(0, 64) : '';
        const text = payload && typeof payload.text === 'string' ? payload.text.trim().slice(0, MAX_MESSAGE_CHARS) : '';
        if (!requestId || !text) return { success: false, error: 'Invalid message' };

        const apiKey = getApiKey();
        if (!apiKey) return { success: false, error: 'No Gemini API key saved. Add one in Settings.' };

        let thread = payload.threadId ? readThread(payload.threadId) : null;
        if (payload.threadId && !thread) return { success: false, error: 'This chat no longer exists' };
        if (thread && [...active.values()].some(a => a.threadId === thread.id)) {
            return { success: false, error: 'Still answering the previous message in this chat' };
        }
        const now = Date.now();
        if (!thread) thread = { id: crypto.randomUUID(), title: makeTitle(text), createdAt: now, updatedAt: now, messages: [] };

        const contents = buildContents([...thread.messages, { role: 'user', text }]);
        const sender = event.sender;
        const send = (channel, data) => {
            if (!sender.isDestroyed()) sender.send(channel, data);
        };
        const controller = new AbortController();
        active.set(requestId, { controller, threadId: thread.id });
        const model = getAvailableModel();

        let fullText = '';
        try {
            const ai = new GoogleGenAI({ apiKey });
            const stream = await ai.models.generateContentStream({
                model,
                contents,
                config: { systemInstruction: SYSTEM_PROMPT, abortSignal: controller.signal },
            });
            incrementLimitCount(model);
            for await (const chunk of stream) {
                if (controller.signal.aborted) break;
                if (chunk.text) {
                    fullText += chunk.text;
                    send('chat:chunk', { requestId, threadId: thread.id, text: fullText });
                }
            }
        } catch (err) {
            if (!controller.signal.aborted) {
                console.error('[Chat] Request failed:', err);
                active.delete(requestId);
                // Nothing is saved for a failed turn, so the user can just resend it.
                return { success: false, error: (err && err.message) || 'Request failed' };
            }
        }
        active.delete(requestId);

        const stopped = controller.signal.aborted;
        // Keep the exchange (a stopped reply keeps whatever text arrived).
        thread.messages.push({ role: 'user', text, at: now });
        if (fullText) thread.messages.push({ role: 'model', text: fullText, at: Date.now(), ...(stopped ? { stopped: true } : {}) });
        thread.updatedAt = Date.now();
        try {
            writeThread(thread);
        } catch (err) {
            console.error('[Chat] Could not save thread:', err);
        }
        return { success: true, threadId: thread.id, text: fullText, model, stopped };
    });

    ipcMain.handle('chat:stop', (_e, requestId) => {
        const entry = typeof requestId === 'string' ? active.get(requestId) : null;
        if (entry) entry.controller.abort();
        return { success: true };
    });
}

module.exports = { setupChatIpcHandlers };
