/* Document Reader: shows a parsed PDF topic by topic, inside the main window.
 * Mounted into <reader-view>'s shadow root by mountReader().
 * Every piece of document text is inserted with textContent (never innerHTML). */

/** Static markup (no document text), rendered into the shadow root. */
export const READER_TEMPLATE = `
    <header class="topbar">
        <div class="doc-meta">
            <div class="doc-title" id="docTitle">Document Reader</div>
            <div class="doc-sub" id="docSub">Open a PDF to read it topic by topic</div>
        </div>
        <div class="topbar-actions">
            <input id="search" class="search" type="search" placeholder="Search…  (Ctrl+F)" disabled />
            <div class="btn-group" title="Text size">
                <button id="fontDown" class="btn" aria-label="Smaller text">A−</button>
                <button id="fontUp" class="btn" aria-label="Larger text">A+</button>
            </div>
            <button id="openBtn" class="btn primary">Open PDF</button>
        </div>
    </header>

    <div class="layout">
        <aside class="sidebar" id="sidebar" hidden>
            <div class="sidebar-label">Topics</div>
            <nav id="toc" class="toc"></nav>
        </aside>

        <main class="content" id="content">
            <section class="empty" id="emptyState">
                <div class="drop-zone" id="dropZone">
                    <div class="drop-icon">PDF</div>
                    <h2>Drop a PDF here</h2>
                    <p>or</p>
                    <button id="openBtnEmpty" class="btn primary">Choose a file</button>
                    <p class="hint">Headings become topics, bold labels become sub-headings, and tables keep their columns.</p>
                </div>
            </section>
            <section class="status" id="statusState" hidden>
                <div class="spinner" aria-hidden="true"></div>
                <div id="statusText">Reading PDF…</div>
            </section>
            <article class="section-view" id="sectionView" hidden></article>
        </main>
    </div>

    <div class="drag-overlay" id="dragOverlay" hidden><div>Drop PDF to open</div></div>
`;

// The last opened document survives switching to another view and back.
const persisted = { doc: null, index: 0, fontScale: 1 };

/**
 * @param {ShadowRoot} root  shadow root already containing READER_TEMPLATE
 * @param {HTMLElement} host the <reader-view> element (drag/drop + keys are scoped to it)
 * @param {{ openDialog: () => Promise<any>, openDroppedFile: (file: File) => Promise<any> }} api
 * @returns {() => void} dispose
 */
export function mountReader(root, host, api) {
    const $ = id => root.getElementById(id);
    const els = {
        title: $('docTitle'),
        sub: $('docSub'),
        search: $('search'),
        fontDown: $('fontDown'),
        fontUp: $('fontUp'),
        openBtn: $('openBtn'),
        openBtnEmpty: $('openBtnEmpty'),
        sidebar: $('sidebar'),
        toc: $('toc'),
        content: $('content'),
        empty: $('emptyState'),
        status: $('statusState'),
        statusText: $('statusText'),
        view: $('sectionView'),
        overlay: $('dragOverlay'),
    };

    const state = { doc: null, index: 0, query: '', fontScale: 1 };
    const cleanups = [];
    const listen = (target, type, fn) => {
        target.addEventListener(type, fn);
        cleanups.push(() => target.removeEventListener(type, fn));
    };

    // ───────── helpers ─────────

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function runsText(runs) {
        return (runs || []).map(r => r.text).join('');
    }

    /** Append text, wrapping matches of the current search query in <mark>. */
    function appendHighlighted(parent, text) {
        const q = state.query;
        if (!q) {
            parent.appendChild(document.createTextNode(text));
            return;
        }
        const lower = text.toLowerCase();
        let pos = 0;
        let hit = lower.indexOf(q, pos);
        while (hit !== -1) {
            if (hit > pos) parent.appendChild(document.createTextNode(text.slice(pos, hit)));
            parent.appendChild(el('mark', null, text.slice(hit, hit + q.length)));
            pos = hit + q.length;
            hit = lower.indexOf(q, pos);
        }
        if (pos < text.length) parent.appendChild(document.createTextNode(text.slice(pos)));
    }

    function renderRuns(parent, runs) {
        for (const r of runs || []) {
            let target = parent;
            if (r.code) target = target.appendChild(el('code'));
            else if (parent.classList && parent.classList.contains('col-code')) target = target.appendChild(el('span'));
            if (r.bold) target = target.appendChild(el('strong'));
            if (r.italic) target = target.appendChild(el('em'));
            appendHighlighted(target, r.text);
        }
        return parent;
    }

    function blockText(b) {
        switch (b.type) {
            case 'subheading':
                return b.text || runsText(b.runs);
            case 'paragraph':
                return runsText(b.runs);
            case 'list':
                return b.items.map(runsText).join(' ');
            case 'qa':
                return runsText(b.question) + ' ' + runsText(b.answer);
            case 'table':
                return [b.header || [], ...b.rows].map(row => row.map(runsText).join(' ')).join(' ');
            default:
                return '';
        }
    }

    function sectionText(s) {
        return (s.title + ' ' + s.blocks.map(blockText).join(' ')).toLowerCase();
    }

    function countMatches(text, q) {
        if (!q) return 0;
        let n = 0;
        let i = text.indexOf(q);
        while (i !== -1) {
            n++;
            i = text.indexOf(q, i + q.length);
        }
        return n;
    }

    // ───────── block renderers ─────────

    function renderTable(b) {
        const wrap = el('div', 'table-wrap');
        const table = wrap.appendChild(el('table'));
        const header = b.header || [];
        const headerNames = header.map(c => runsText(c).trim().toLowerCase());
        const colClass = i => {
            const h = headerNames[i] || '';
            if (/^(lines?|line no\.?|#|no\.?|step)$/.test(h)) return 'col-narrow';
            if (/^code$/.test(h)) return 'col-code';
            return '';
        };
        if (header.length) {
            const tr = table.appendChild(el('thead')).appendChild(el('tr'));
            header.forEach(c => renderRuns(tr.appendChild(el('th')), c));
        }
        const tbody = table.appendChild(el('tbody'));
        for (const row of b.rows) {
            const tr = tbody.appendChild(el('tr'));
            row.forEach((c, i) => renderRuns(tr.appendChild(el('td', colClass(i))), c));
        }
        return wrap;
    }

    function renderQa(b) {
        const details = el('details', 'qa');
        details.open = true;
        renderRuns(details.appendChild(el('summary')), b.question);
        renderRuns(details.appendChild(el('div', 'answer')).appendChild(el('div')), b.answer);
        return details;
    }

    function renderBlock(b) {
        switch (b.type) {
            case 'paragraph':
                return renderRuns(el('p', b.indented ? 'indented' : ''), b.runs);
            case 'list': {
                const list = el(b.ordered ? 'ol' : 'ul');
                b.items.forEach(item => renderRuns(list.appendChild(el('li')), item));
                return list;
            }
            case 'table':
                return renderTable(b);
            case 'qa':
                return renderQa(b);
            default:
                return null;
        }
    }

    /** Split a section's blocks into cards, one per sub-heading. */
    function groupIntoCards(section) {
        const cards = [];
        let cur = null;
        for (const b of section.blocks) {
            if (b.type === 'subheading') {
                cur = { title: b.text || runsText(b.runs), blocks: [] };
                cards.push(cur);
                continue;
            }
            if (!cur) {
                cur = { title: '', blocks: [] };
                cards.push(cur);
            }
            cur.blocks.push(b);
        }
        return cards;
    }

    function cardId(sectionIdx, cardIdx) {
        return `card-${sectionIdx}-${cardIdx}`;
    }

    // ───────── section view ─────────

    function renderSection(scrollToCard) {
        const doc = state.doc;
        const s = doc.sections[state.index];
        persisted.index = state.index;
        const view = els.view;
        view.replaceChildren();

        const head = view.appendChild(el('header', 'section-head'));
        if (s.tag || s.range) {
            const kicker = head.appendChild(el('div', 'section-kicker'));
            if (s.tag) kicker.appendChild(el('span', null, s.tag));
            if (s.range) kicker.appendChild(el('span', 'range', s.range));
        }
        const h1 = head.appendChild(el('h1', 'section-title'));
        appendHighlighted(h1, s.shortTitle || s.title);

        const cards = groupIntoCards(s);
        const titled = cards.map((c, i) => ({ c, i })).filter(x => x.c.title);
        if (titled.length > 1) {
            const chips = view.appendChild(el('nav', 'chips'));
            for (const { c, i } of titled) {
                const chip = chips.appendChild(el('button', 'chip', c.title));
                chip.addEventListener('click', () => scrollToId(cardId(state.index, i)));
            }
        }

        cards.forEach((c, i) => {
            const isSay = /^what to say\b/i.test(c.title);
            const card = view.appendChild(el('section', 'card' + (c.title ? '' : ' intro') + (isSay ? ' say' : '')));
            card.id = cardId(state.index, i);
            if (c.title) {
                const h2 = card.appendChild(el('h2', 'card-title'));
                appendHighlighted(h2, c.title);
            }
            const qaCount = c.blocks.filter(b => b.type === 'qa').length;
            if (qaCount > 1) {
                const tools = card.appendChild(el('div', 'qa-tools'));
                const toggle = tools.appendChild(el('button', 'link-btn', 'Collapse all answers'));
                toggle.addEventListener('click', () => {
                    const items = card.querySelectorAll('details.qa');
                    const anyOpen = Array.from(items).some(d => d.open);
                    items.forEach(d => (d.open = !anyOpen));
                    toggle.textContent = anyOpen ? 'Expand all answers' : 'Collapse all answers';
                });
            }
            for (const b of c.blocks) {
                const node = renderBlock(b);
                if (node) card.appendChild(node);
            }
        });

        // Prev / next pager
        const pager = view.appendChild(el('nav', 'pager'));
        const addPage = (idx, cls, label) => {
            const t = doc.sections[idx];
            const btn = pager.appendChild(el('button', 'btn ' + cls));
            btn.appendChild(el('small', null, label));
            btn.appendChild(document.createTextNode([t.tag, t.shortTitle || t.title].filter(Boolean).join(' · ')));
            btn.addEventListener('click', () => goTo(idx));
        };
        if (state.index > 0) addPage(state.index - 1, 'prev', '← Previous');
        if (state.index < doc.sections.length - 1) addPage(state.index + 1, 'next', 'Next →');

        updateTocActive();
        if (scrollToCard != null) scrollToId(cardId(state.index, scrollToCard));
        else if (state.query) {
            const m = view.querySelector('mark');
            if (m) m.scrollIntoView({ block: 'center' });
            else els.content.scrollTop = 0;
        } else els.content.scrollTop = 0;
    }

    function scrollToId(id) {
        const node = root.getElementById(id);
        if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function goTo(idx, cardIdx) {
        if (!state.doc || idx < 0 || idx >= state.doc.sections.length) return;
        state.index = idx;
        renderSection(cardIdx);
    }

    // ───────── sidebar ─────────

    function renderToc() {
        const doc = state.doc;
        els.toc.replaceChildren();
        let visible = 0;
        doc.sections.forEach((s, idx) => {
            const matches = countMatches(s._text, state.query);
            if (state.query && !matches) return;
            visible++;
            const item = els.toc.appendChild(el('button', 'toc-item'));
            item.dataset.index = String(idx);
            item.appendChild(el('span', 'toc-tag', s.tag ? s.tag.split(' ').pop() : String(idx + 1)));
            const text = item.appendChild(el('span', 'toc-text', s.shortTitle || s.title));
            if (matches) text.appendChild(el('span', 'toc-count', `${matches}`));
            if (s.range) text.appendChild(el('span', 'toc-range', s.range));
            item.addEventListener('click', () => goTo(idx));

            const cards = groupIntoCards(s);
            if (cards.some(c => c.title)) {
                const subs = els.toc.appendChild(el('div', 'toc-subs'));
                subs.dataset.index = String(idx);
                cards.forEach((c, ci) => {
                    if (!c.title) return;
                    const sub = subs.appendChild(el('button', 'toc-sub', c.title));
                    sub.addEventListener('click', () => goTo(idx, ci));
                });
            }
        });
        if (!visible) els.toc.appendChild(el('div', 'no-results', 'No topic matches your search.'));
        updateTocActive();
    }

    function updateTocActive() {
        els.toc.querySelectorAll('.toc-item').forEach(b => b.classList.toggle('active', Number(b.dataset.index) === state.index));
        // Only the open topic shows its sub-headings, unless searching.
        els.toc.querySelectorAll('.toc-subs').forEach(d => {
            d.hidden = !state.query && Number(d.dataset.index) !== state.index;
        });
        const active = els.toc.querySelector('.toc-item.active');
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    // ───────── loading ─────────

    function showStatus(text, isError) {
        els.empty.hidden = true;
        els.view.hidden = true;
        els.status.hidden = false;
        els.status.classList.toggle('error', Boolean(isError));
        els.statusText.textContent = text;
    }

    function showDoc(doc, startIndex = 0) {
        if (!doc || !Array.isArray(doc.sections) || !doc.sections.length) {
            showStatus('No readable text was found in this PDF (it may be a scanned image).', true);
            return;
        }
        doc.sections.forEach(s => (s._text = sectionText(s)));
        state.doc = doc;
        state.index = Math.min(Math.max(0, startIndex), doc.sections.length - 1);
        persisted.doc = doc;
        state.query = '';
        els.search.value = '';
        els.search.disabled = false;
        els.title.textContent = doc.title || doc.fileName || 'Document';
        els.sub.textContent = [doc.fileName, doc.pageCount ? `${doc.pageCount} pages` : '', `${doc.sections.length} topics`]
            .filter(Boolean)
            .join(' · ');
        els.status.hidden = true;
        els.empty.hidden = true;
        els.sidebar.hidden = false;
        els.view.hidden = false;
        renderToc();
        renderSection();
    }

    async function load(promiseFactory) {
        showStatus('Reading PDF…');
        try {
            const res = await promiseFactory();
            if (res && res.success) showDoc(res.doc);
            else if (res && res.canceled) restoreAfterCancel();
            else showStatus((res && res.error) || 'Could not read this PDF', true);
        } catch (err) {
            showStatus((err && err.message) || 'Could not read this PDF', true);
        }
    }

    function restoreAfterCancel() {
        els.status.hidden = true;
        if (state.doc) els.view.hidden = false;
        else els.empty.hidden = false;
    }

    const openDialog = () => load(() => api.openDialog());
    els.openBtn.addEventListener('click', openDialog);
    els.openBtnEmpty.addEventListener('click', openDialog);

    // ───────── drag & drop ─────────

    let dragDepth = 0;
    listen(host, 'dragenter', e => {
        e.preventDefault();
        dragDepth++;
        els.overlay.hidden = false;
    });
    listen(host, 'dragleave', e => {
        e.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (!dragDepth) els.overlay.hidden = true;
    });
    listen(host, 'dragover', e => e.preventDefault());
    listen(host, 'drop', e => {
        e.preventDefault();
        dragDepth = 0;
        els.overlay.hidden = true;
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        if (!/\.pdf$/i.test(file.name)) {
            showStatus('Please drop a .pdf file', true);
            return;
        }
        load(() => api.openDroppedFile(file));
    });

    // ───────── search, font, keys ─────────

    let searchTimer = null;
    els.search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.query = els.search.value.trim().toLowerCase();
            if (!state.doc) return;
            if (state.query && !countMatches(state.doc.sections[state.index]._text, state.query)) {
                const first = state.doc.sections.findIndex(s => countMatches(s._text, state.query));
                if (first !== -1) state.index = first;
            }
            renderToc();
            renderSection();
        }, 150);
    });

    function setFont(delta) {
        state.fontScale = Math.min(1.6, Math.max(0.8, Math.round((state.fontScale + delta) * 10) / 10));
        persisted.fontScale = state.fontScale;
        host.style.setProperty('--font-scale', String(state.fontScale));
    }
    els.fontDown.addEventListener('click', () => setFont(-0.1));
    els.fontUp.addEventListener('click', () => setFont(0.1));

    listen(window, 'keydown', e => {
        if (!host.isConnected) return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key.toLowerCase() === 'f' && !els.search.disabled) {
            e.preventDefault();
            els.search.focus();
            els.search.select();
            return;
        }
        if (ctrl && e.key.toLowerCase() === 'o') {
            e.preventDefault();
            openDialog();
            return;
        }
        if (ctrl && (e.key === '=' || e.key === '+')) return setFont(0.1);
        if (ctrl && e.key === '-') return setFont(-0.1);
        if (e.composedPath()[0] === els.search) {
            if (e.key === 'Escape') {
                els.search.value = '';
                els.search.dispatchEvent(new Event('input'));
                els.search.blur();
            }
            return;
        }
        if (!state.doc) return;
        if (e.key === 'ArrowRight') goTo(state.index + 1);
        else if (e.key === 'ArrowLeft') goTo(state.index - 1);
    });

    // Restore the previously opened document, if any.
    if (persisted.fontScale !== 1) setFont(persisted.fontScale - state.fontScale);
    if (persisted.doc) showDoc(persisted.doc, persisted.index);

    return () => {
        clearTimeout(searchTimer);
        cleanups.forEach(fn => fn());
    };
}
