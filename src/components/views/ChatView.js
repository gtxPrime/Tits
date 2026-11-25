import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

/*
 * Ask AI: chat threads with Gemini using the saved API key.
 * Threads (and their full history, sent as context with each message) are stored by the
 * main process; see src/utils/chatIpc.js. This module-level state keeps the open thread and
 * any in-flight reply across switching views.
 */
const store = {
    threadId: null, // open thread, null = new chat
    messages: [], // [{ role, text, pending?, stopped? }]
    pending: null, // { requestId, threadId|null, userText, liveText }
    view: null,
};

/** Markdown → HTML with anything executable stripped (the main window has Node access). */
function renderMarkdownSafe(text) {
    let raw = '';
    try {
        raw = window.marked ? window.marked.parse(text, { breaks: true, gfm: true }) : '';
    } catch (_) {}
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    if (!window.marked) doc.body.textContent = text;
    doc.querySelectorAll(
        'script, style, iframe, object, embed, link, meta, form, input, button, textarea, select, img, video, audio, svg, math'
    ).forEach(n => n.remove());
    doc.body.querySelectorAll('*').forEach(node => {
        for (const attr of Array.from(node.attributes)) {
            const name = attr.name.toLowerCase();
            const keep = (name === 'href' && /^https?:/i.test(attr.value)) || (name === 'class' && node.tagName === 'CODE');
            if (!keep) node.removeAttribute(attr.name);
        }
    });
    if (window.hljs) doc.querySelectorAll('pre code').forEach(c => window.hljs.highlightElement(c));
    return doc.body.innerHTML;
}

function timeAgo(ts) {
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
    return new Date(ts).toLocaleDateString();
}

const ipc = () => (window.require ? window.require('electron').ipcRenderer : null);

export class ChatView extends LitElement {
    static properties = {
        _threads: { state: true },
        _threadId: { state: true },
        _messages: { state: true },
        _input: { state: true },
        _busy: { state: true },
        _error: { state: true },
        _hasKey: { state: true },
    };

    static styles = css`
        * {
            box-sizing: border-box;
            font-family: var(--font);
        }
        :host {
            display: flex;
            height: 100%;
            min-height: 0;
            background: var(--bg-app);
            color: var(--text-primary);
        }
        .btn {
            height: 32px;
            padding: 0 14px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.04);
            color: var(--text-primary);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            -webkit-app-region: no-drag;
        }
        .btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.09);
        }
        .btn:disabled {
            opacity: 0.45;
            cursor: default;
        }
        .btn.primary {
            background: var(--accent);
            border-color: var(--accent);
            color: var(--accent-text);
        }
        .btn.primary:hover:not(:disabled) {
            background: var(--accent-hover);
        }

        /* ── thread list ── */
        .threads {
            width: 230px;
            min-width: 230px;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--border);
            padding: 22px 10px 12px;
            min-height: 0;
        }
        .threads .btn.new {
            width: 100%;
            margin-bottom: 12px;
        }
        .thread-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .thread-list::-webkit-scrollbar,
        .log::-webkit-scrollbar {
            width: 6px;
        }
        .thread-list::-webkit-scrollbar-thumb,
        .log::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 999px;
        }
        .thread {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
            width: 100%;
            text-align: left;
            padding: 8px 30px 8px 10px;
            border-radius: 8px;
            border: 1px solid transparent;
            background: none;
            color: var(--text-secondary);
            cursor: pointer;
        }
        .thread:hover {
            background: rgba(255, 255, 255, 0.04);
            color: var(--text-primary);
        }
        .thread.active {
            background: var(--accent-subtle);
            border-color: var(--border-strong);
            color: var(--text-primary);
        }
        .thread-title {
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .thread-meta {
            font-size: 11px;
            color: var(--text-muted);
        }
        .thread-del {
            position: absolute;
            top: 50%;
            right: 6px;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            border: none;
            border-radius: 5px;
            background: none;
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1;
            cursor: pointer;
            opacity: 0;
        }
        .thread:hover .thread-del {
            opacity: 1;
        }
        .thread-del:hover {
            background: rgba(239, 68, 68, 0.18);
            color: #fca5a5;
        }
        .no-threads {
            font-size: 12px;
            color: var(--text-muted);
            padding: 8px 10px;
        }
        .clear-all {
            margin-top: 8px;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 11.5px;
            cursor: pointer;
            padding: 6px;
        }
        .clear-all:hover {
            color: #fca5a5;
        }

        /* ── conversation ── */
        .main {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
        .head {
            padding: 22px 28px 12px;
        }
        .title {
            font-size: 17px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sub {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
        }
        .log {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 8px 28px 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .msg {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.55;
            user-select: text;
            word-wrap: break-word;
        }
        .msg.user {
            align-self: flex-end;
            background: var(--accent-subtle);
            border: 1px solid var(--border-strong);
            white-space: pre-wrap;
        }
        .msg.model {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.035);
            border: 1px solid var(--border);
        }
        .msg.model > :first-child {
            margin-top: 0;
        }
        .msg.model > :last-child {
            margin-bottom: 0;
        }
        .msg pre {
            background: rgba(0, 0, 0, 0.35);
            padding: 10px 12px;
            border-radius: 8px;
            overflow-x: auto;
        }
        .msg code {
            font-family: 'Cascadia Code', Consolas, 'SF Mono', Menlo, monospace;
            font-size: 0.9em;
        }
        .msg table {
            border-collapse: collapse;
        }
        .msg th,
        .msg td {
            border: 1px solid var(--border);
            padding: 4px 8px;
        }
        .msg a {
            color: var(--accent);
            cursor: pointer;
        }
        .typing {
            color: var(--text-muted);
            font-style: italic;
        }
        .stopped-note {
            align-self: flex-start;
            margin-top: -8px;
            font-size: 11px;
            color: var(--text-muted);
        }
        .empty {
            margin: auto;
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
            max-width: 380px;
            line-height: 1.6;
        }
        .error {
            margin: 0 28px 8px;
            padding: 8px 12px;
            border-radius: 8px;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.35);
            color: #fca5a5;
            font-size: 12.5px;
        }
        .composer {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            padding: 12px 28px 22px;
            border-top: 1px solid var(--border);
        }
        textarea {
            flex: 1;
            resize: none;
            min-height: 42px;
            max-height: 180px;
            padding: 11px 14px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-primary);
            font-size: 14px;
            line-height: 1.4;
            outline: none;
        }
        textarea:focus {
            border-color: var(--border-strong);
        }
        .composer .btn {
            height: 42px;
        }

        @media (max-width: 860px) {
            .threads {
                width: 180px;
                min-width: 180px;
            }
        }
    `;

    constructor() {
        super();
        this._threads = [];
        this._input = '';
        this._error = '';
        this._hasKey = true;
        this._syncFromStore();
        this._onChunk = (_e, data) => {
            const p = store.pending;
            if (!data || !p || data.requestId !== p.requestId) return;
            p.liveText = data.text;
            if (p.threadId === null) p.newThreadId = data.threadId;
            // A reply to a brand-new chat that is still open: it now has an id.
            if (p.threadId === null && store.threadId === null && store.messages.some(m => m.pending)) {
                p.threadId = data.threadId;
                store.threadId = data.threadId;
            }
            if (store.threadId !== data.threadId) return; // user switched to another thread
            this._updatePlaceholder(data.text);
        };
    }

    // ───────── store sync ─────────

    _syncFromStore() {
        this._threadId = store.threadId;
        this._messages = store.messages;
        this._busy = Boolean(store.pending);
    }

    _setMessages(messages) {
        store.messages = messages;
        if (store.view) store.view._syncFromStore();
        this._syncFromStore();
        this._scrollToBottom();
    }

    _updatePlaceholder(text) {
        const msgs = store.messages.slice();
        const i = msgs.findIndex(m => m.pending);
        if (i === -1) return;
        msgs[i] = { ...msgs[i], text };
        this._setMessages(msgs);
    }

    // ───────── lifecycle ─────────

    connectedCallback() {
        super.connectedCallback();
        store.view = this;
        this._syncFromStore();
        const r = ipc();
        if (!r) return;
        r.on('chat:chunk', this._onChunk);
        r.invoke('chat:has-key')
            .then(res => (this._hasKey = Boolean(res && res.hasKey)))
            .catch(() => {});
        this._refreshThreads();
        // Pick up anything saved while the page was closed (e.g. a reply that finished meanwhile).
        if (store.threadId && !store.pending) this._openThread(store.threadId);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        const r = ipc();
        if (r) r.removeListener('chat:chunk', this._onChunk);
        if (store.view === this) store.view = null;
        // An in-flight reply keeps going and is saved by the main process.
    }

    firstUpdated() {
        this._scrollToBottom();
    }

    updated() {
        // Assistant replies are sanitized HTML; set outside Lit's text bindings.
        this.shadowRoot.querySelectorAll('.msg.model[data-i]').forEach(node => {
            const m = this._messages[Number(node.dataset.i)];
            if (!m || node._rendered === m.text) return;
            node._rendered = m.text;
            if (m.pending && !m.text) node.innerHTML = '<span class="typing">Thinking…</span>';
            else node.innerHTML = renderMarkdownSafe(m.text);
        });
    }

    // ───────── threads ─────────

    async _refreshThreads() {
        const r = ipc();
        if (!r) return;
        try {
            const list = await r.invoke('chat:list');
            const view = store.view || this;
            view._threads = Array.isArray(list) ? list : [];
        } catch (_) {}
    }

    async _openThread(id) {
        const r = ipc();
        if (!r) return;
        this._error = '';
        const thread = await r.invoke('chat:get', id);
        if (!thread) {
            if (store.threadId === id) this._newChat();
            this._refreshThreads();
            return;
        }
        store.threadId = thread.id;
        const msgs = thread.messages.map(m => ({ role: m.role, text: m.text, stopped: Boolean(m.stopped) }));
        // Still answering in this thread: keep showing the live reply.
        if (store.pending && (store.pending.threadId || store.pending.newThreadId) === thread.id) {
            msgs.push({ role: 'user', text: store.pending.userText });
            msgs.push({ role: 'model', text: store.pending.liveText, pending: true });
        }
        this._setMessages(msgs);
    }

    _newChat() {
        this._error = '';
        store.threadId = null;
        this._setMessages([]);
        this.updateComplete.then(() => this._focusInput());
    }

    async _deleteThread(e, id) {
        e.stopPropagation();
        const r = ipc();
        if (!r) return;
        await r.invoke('chat:delete', id);
        if (store.threadId === id) this._newChat();
        this._refreshThreads();
    }

    async _deleteAll() {
        if (!window.confirm('Delete all saved chats? This cannot be undone.')) return;
        const r = ipc();
        if (!r) return;
        await r.invoke('chat:delete-all');
        this._newChat();
        this._refreshThreads();
    }

    // ───────── sending ─────────

    async _send() {
        const text = this._input.trim();
        const r = ipc();
        if (!text || store.pending || !r) return;
        this._error = '';
        this._input = '';
        const ta = this.shadowRoot.querySelector('textarea');
        if (ta) ta.style.height = '';

        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const threadId = store.threadId;
        store.pending = { requestId, threadId, userText: text, liveText: '' };
        this._setMessages([...store.messages, { role: 'user', text }, { role: 'model', text: '', pending: true }]);

        let res;
        try {
            res = await r.invoke('chat:send', { requestId, threadId, text });
        } catch (err) {
            res = { success: false, error: (err && err.message) || 'Request failed' };
        }
        store.pending = null;
        const view = store.view || this;
        const stillHere = store.threadId === threadId || (res && res.threadId && store.threadId === res.threadId);

        if (res && res.success) {
            if (stillHere) await view._openThread(res.threadId);
            else view._syncFromStore();
        } else {
            if (stillHere) {
                // Nothing was saved: drop the optimistic messages and give the text back.
                const msgs = store.messages.filter(m => !m.pending);
                if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs.pop();
                view._setMessages(msgs);
                if (!view._input) view._input = text;
            } else view._syncFromStore();
            view._error = (res && res.error) || 'Request failed';
            if (/api key/i.test(view._error)) view._hasKey = false;
        }
        view._refreshThreads();
        view.updateComplete.then(() => view._focusInput());
    }

    _stop() {
        const r = ipc();
        if (r && store.pending) r.invoke('chat:stop', store.pending.requestId);
    }

    // ───────── UI helpers ─────────

    _focusInput() {
        const ta = this.shadowRoot && this.shadowRoot.querySelector('textarea');
        if (ta) ta.focus();
    }

    _onKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            this._send();
        }
    }

    _onInput(e) {
        this._input = e.target.value;
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
    }

    _onLogClick(e) {
        // Links in replies open in the default browser, never inside the app window.
        const a = e.composedPath().find(n => n.tagName === 'A');
        if (!a) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        const r = ipc();
        if (r && href && /^https?:/i.test(href)) r.invoke('open-external', href);
    }

    _scrollToBottom() {
        this.updateComplete.then(() => {
            const log = this.shadowRoot && this.shadowRoot.querySelector('.log');
            if (log) log.scrollTop = log.scrollHeight;
        });
    }

    _openSettings() {
        const app = window.titsApp || document.querySelector('tits-app');
        if (app && typeof app.navigate === 'function') app.navigate('customize');
    }

    // ───────── render ─────────

    _renderThreads() {
        return html`
            <aside class="threads">
                <button class="btn primary new" @click=${() => this._newChat()}>+ New chat</button>
                <div class="thread-list">
                    ${
                        this._threads.length
                            ? this._threads.map(
                                  t => html`
                                      <div
                                          class="thread ${t.id === this._threadId ? 'active' : ''}"
                                          role="button"
                                          @click=${() => this._openThread(t.id)}
                                          title=${t.title}
                                      >
                                          <span class="thread-title">${t.title}</span>
                                          <span class="thread-meta">${timeAgo(t.updatedAt)} · ${t.count} messages</span>
                                          <button class="thread-del" title="Delete chat" @click=${e => this._deleteThread(e, t.id)}>×</button>
                                      </div>
                                  `
                              )
                            : html`<div class="no-threads">No saved chats yet.</div>`
                    }
                </div>
                ${this._threads.length ? html`<button class="clear-all" @click=${() => this._deleteAll()}>Delete all chats</button>` : ''}
            </aside>
        `;
    }

    render() {
        const current = this._threads.find(t => t.id === this._threadId);
        return html`
            ${this._renderThreads()}
            <section class="main">
                <div class="head">
                    <div class="title">${current ? current.title : 'New chat'}</div>
                    <div class="sub">Gemini with your saved API key · earlier messages in this chat are sent as context</div>
                </div>

                <div class="log" @click=${e => this._onLogClick(e)}>
                    ${
                        this._messages.length
                            ? this._messages.map(m =>
                                  m.role === 'user'
                                      ? html`<div class="msg user">${m.text}</div>`
                                      : html`<div class="msg model" data-i=${this._messages.indexOf(m)}></div>
                                            ${m.stopped ? html`<div class="stopped-note">Stopped</div>` : ''}`
                              )
                            : html`<div class="empty">
                                  ${
                                      this._hasKey
                                          ? 'Ask anything. Follow-up questions in the same chat remember the conversation. Enter sends, Shift+Enter adds a new line.'
                                          : html`No Gemini API key saved yet.<br /><br /><button
                                                    class="btn primary"
                                                    @click=${() => this._openSettings()}
                                                >
                                                    Open Settings
                                                </button>`
                                  }
                              </div>`
                    }
                </div>

                ${this._error ? html`<div class="error">${this._error}</div>` : ''}

                <div class="composer">
                    <textarea
                        rows="1"
                        placeholder=${this._threadId ? 'Reply in this chat…' : 'Start a new chat…'}
                        .value=${this._input}
                        @input=${e => this._onInput(e)}
                        @keydown=${e => this._onKeyDown(e)}
                    ></textarea>
                    ${
                        this._busy
                            ? html`<button class="btn" @click=${() => this._stop()}>Stop</button>`
                            : html`<button class="btn primary" @click=${() => this._send()} ?disabled=${!this._input.trim()}>Send</button>`
                    }
                </div>
            </section>
        `;
    }
}

customElements.define('chat-view', ChatView);
