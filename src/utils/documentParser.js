/**
 * PDF → structured document parser for the Document Reader window.
 *
 * Reads a PDF with pdf.js, then rebuilds its structure from the text layout:
 *   - headings (by font size), turned into top-level sections ("topics")
 *   - bold sub-headings and bold "Label:" lead-ins ("What it does:")
 *   - paragraphs with inline bold and code runs
 *   - numbered / bulleted lists
 *   - multi-column tables (including tables that continue across pages)
 *   - Q:/A: pairs
 *
 * `buildDocument()` is pure (no pdf.js) so it can be unit-tested with synthetic pages.
 */

const fs = require('node:fs');
const path = require('node:path');

const MAX_PDF_BYTES = 100 * 1024 * 1024;

// ───────────────────────── PDF extraction ─────────────────────────

let pdfjsPromise = null;
function loadPdfjs() {
    if (!pdfjsPromise) pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
    return pdfjsPromise;
}

function fontFlags(fontObj, style) {
    const name = (fontObj && fontObj.name) || '';
    const family = (style && style.fontFamily) || '';
    return {
        bold: /bold|semibold|demi|black|heavy/i.test(name) || Boolean(fontObj && fontObj.bold),
        mono: /mono|courier|consol|code/i.test(name) || family === 'monospace' || Boolean(fontObj && fontObj.isMonospace),
    };
}

/** Extract positioned text items from every page of a PDF. */
async function extractPages(data) {
    const pdfjs = await loadPdfjs();
    const doc = await pdfjs.getDocument({
        data,
        isEvalSupported: false,
        disableFontFace: true,
        useSystemFonts: false,
        verbosity: 0,
    }).promise;

    const pages = [];
    try {
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const viewport = page.getViewport({ scale: 1 });
            // Loading the operator list resolves font objects so we can read real font names (bold / mono).
            await page.getOperatorList();
            const tc = await page.getTextContent();
            const fontCache = {};
            const items = [];
            for (const it of tc.items) {
                if (!it.str || !it.str.trim()) continue;
                if (!(it.fontName in fontCache)) {
                    let obj = null;
                    try {
                        obj = page.commonObjs.get(it.fontName);
                    } catch (_) {}
                    fontCache[it.fontName] = fontFlags(obj, tc.styles[it.fontName]);
                }
                const size = Math.hypot(it.transform[2], it.transform[3]) || it.height || 10;
                items.push({
                    str: it.str,
                    x: it.transform[4],
                    y: viewport.height - it.transform[5], // top-down
                    w: it.width,
                    size: Math.round(size * 10) / 10,
                    bold: fontCache[it.fontName].bold,
                    mono: fontCache[it.fontName].mono,
                });
            }
            pages.push({ width: viewport.width, height: viewport.height, items });
            page.cleanup();
        }
    } finally {
        await doc.destroy();
    }
    return pages;
}

/** Validate a path coming from the renderer and parse it. */
async function parsePdfFile(filePath) {
    if (typeof filePath !== 'string' || !filePath) throw new Error('No file path given');
    const resolved = path.resolve(filePath);
    if (path.extname(resolved).toLowerCase() !== '.pdf') throw new Error('Only .pdf files are supported');
    const stat = await fs.promises.stat(resolved);
    if (!stat.isFile()) throw new Error('Not a file');
    if (stat.size > MAX_PDF_BYTES) throw new Error('PDF is larger than 100 MB');
    const buf = await fs.promises.readFile(resolved);
    const pages = await extractPages(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
    const doc = buildDocument(pages);
    doc.fileName = path.basename(resolved);
    doc.pageCount = pages.length;
    if (!doc.title) doc.title = doc.fileName.replace(/\.pdf$/i, '');
    return doc;
}

// ───────────────────────── Layout analysis ─────────────────────────

function mode(values) {
    const counts = new Map();
    let best = null;
    let bestCount = 0;
    for (const v of values) {
        const c = (counts.get(v) || 0) + 1;
        counts.set(v, c);
        if (c > bestCount) {
            best = v;
            bestCount = c;
        }
    }
    return best;
}

/** Body text size = size carrying the most characters. */
function bodySize(pages) {
    const weight = new Map();
    for (const pg of pages) for (const it of pg.items) weight.set(it.size, (weight.get(it.size) || 0) + it.str.length);
    let best = 12;
    let bestW = -1;
    for (const [s, w] of weight) if (w > bestW) [best, bestW] = [s, w];
    return best;
}

/** Remove running headers / footers / page numbers. */
function stripMargins(pages, body) {
    const marginText = new Map();
    const isMargin = (it, pg) => it.y < pg.height * 0.09 || it.y > pg.height * 0.92;
    const norm = s => s.replace(/\d+/g, '#').trim();
    for (const pg of pages) {
        const seen = new Set();
        for (const it of pg.items) if (isMargin(it, pg)) seen.add(norm(it.str));
        for (const s of seen) marginText.set(s, (marginText.get(s) || 0) + 1);
    }
    const repeatMin = Math.max(2, Math.ceil(pages.length * 0.5));
    return pages.map(pg => ({
        ...pg,
        items: pg.items.filter(it => {
            if (!isMargin(it, pg)) return true;
            if (it.size < body * 0.7) return false;
            if (pages.length > 1 && marginText.get(norm(it.str)) >= repeatMin) return false;
            if (/^\s*(page\s*)?\d+(\s*(of|\/)\s*\d+)?\s*$/i.test(it.str)) return false;
            return true;
        }),
    }));
}

/** Group a page's items into visual lines, then split each line into column segments. */
function buildLines(page, pageIndex) {
    const items = [...page.items].sort((a, b) => a.y - b.y || a.x - b.x);
    const lines = [];
    for (const it of items) {
        const tol = Math.max(2, it.size * 0.45);
        let line = null;
        for (let i = lines.length - 1; i >= 0 && i >= lines.length - 4; i--) {
            if (Math.abs(lines[i].y - it.y) <= tol) {
                line = lines[i];
                break;
            }
        }
        if (!line) {
            line = { y: it.y, items: [], page: pageIndex };
            lines.push(line);
        }
        line.items.push(it);
    }
    for (const line of lines) {
        line.items.sort((a, b) => a.x - b.x);
        line.size = Math.max(...line.items.map(i => i.size));
        line.segments = [];
        let seg = null;
        let prevEnd = null;
        for (const it of line.items) {
            const gap = prevEnd === null ? 0 : it.x - prevEnd;
            if (!seg || gap > Math.max(it.size, 9) * 1.2) {
                seg = { x: it.x, items: [] };
                line.segments.push(seg);
            }
            seg.items.push(it);
            prevEnd = Math.max(prevEnd === null ? -Infinity : prevEnd, it.x + it.w);
        }
        line.x = line.segments[0].x;
    }
    lines.sort((a, b) => a.y - b.y);
    return lines;
}

/** Convert positioned items into styled runs: [{ text, bold, code }]. */
function itemsToRuns(items) {
    const runs = [];
    let prevEnd = null;
    for (const it of items) {
        const needsSpace = prevEnd !== null && it.x - prevEnd > it.size * 0.12;
        const style = { bold: it.bold && !it.mono, code: it.mono };
        let text = it.str.replace(/\s+/g, ' ');
        const last = runs[runs.length - 1];
        if (last && last.bold === style.bold && last.code === style.code) {
            last.text += (needsSpace && !last.text.endsWith(' ') && !text.startsWith(' ') ? ' ' : '') + text;
        } else {
            if (needsSpace && last && !last.text.endsWith(' ') && !text.startsWith(' ')) {
                // Put the separating space in the plain run so code/bold runs stay tight.
                if (!last.code && !last.bold) last.text += ' ';
                else if (!style.code && !style.bold) text = ' ' + text;
                else runs.push({ text: ' ', bold: false, code: false });
            }
            runs.push({ text, ...style });
        }
        prevEnd = it.x + it.w;
    }
    return runs;
}

/** Append runs to an existing run list, joining wrapped lines with a space (or nothing after a hyphen). */
function appendRuns(target, runs) {
    if (!runs.length) return target;
    if (target.length) {
        const last = target[target.length - 1];
        const joinNoSpace = /[-/]$/.test(last.text) || last.text.endsWith(' ');
        const sameStyle = last.bold === runs[0].bold && last.code === runs[0].code;
        if (!joinNoSpace) {
            if (sameStyle || (!last.code && !last.bold)) last.text += ' ';
            else target.push({ text: ' ', bold: false, code: false });
        }
    }
    for (const r of runs) {
        const last = target[target.length - 1];
        if (last && last.bold === r.bold && last.code === r.code) last.text += r.text;
        else target.push({ ...r });
    }
    return target;
}

function runsText(runs) {
    return runs
        .map(r => r.text)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
}

function trimRuns(runs) {
    const out = runs.map(r => ({ ...r })).filter(r => r.text.length);
    while (out.length && !out[0].text.trim()) out.shift();
    while (out.length && !out[out.length - 1].text.trim()) out.pop();
    if (out.length) {
        out[0].text = out[0].text.replace(/^\s+/, '');
        out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '');
    }
    return out;
}

// ───────────────────────── Tables ─────────────────────────

const COL_TOL = 6;

function matchAnchor(anchors, x) {
    return anchors.findIndex(a => Math.abs(a - x) <= COL_TOL);
}

/** Which column a segment starting at x belongs to: the last anchor at or left of x (+tolerance). */
function columnFor(anchors, x) {
    let col = 0;
    for (let i = 0; i < anchors.length; i++) if (anchors[i] <= x + COL_TOL) col = i;
    return col;
}

/**
 * Split a page's lines into table regions and text lines.
 * A table starts at a line with ≥2 column segments and continues while every
 * segment of the following lines lines up with a known column.
 */
function findRegions(lines, body) {
    const regions = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.segments.length >= 2) {
            const anchors = line.segments.map(s => s.x);
            const tableLines = [line];
            let multi = 1;
            let j = i + 1;
            while (j < lines.length) {
                const next = lines[j];
                const gap = next.y - lines[j - 1].y;
                if (gap > Math.max(next.size, body) * 3.2) break;
                if (next.size > body * 1.2) break;
                const fits = next.segments.every(s => matchAnchor(anchors, s.x) !== -1 || (s !== next.segments[0] && s.x > anchors[0]));
                if (!fits) break;
                if (next.segments.length === 1 && matchAnchor(anchors, next.segments[0].x) === -1) break;
                for (const s of next.segments) {
                    if (matchAnchor(anchors, s.x) === -1) {
                        anchors.push(s.x);
                        anchors.sort((a, b) => a - b);
                    }
                }
                if (next.segments.length >= 2) multi++;
                tableLines.push(next);
                j++;
            }
            if (multi >= 2) {
                regions.push({ type: 'table', lines: tableLines, anchors });
                i = j;
                continue;
            }
        }
        regions.push({ type: 'line', line });
        i++;
    }
    return regions;
}

function buildTable(region) {
    // Collapse anchors that ended up very close together, keep the left-most.
    const anchors = [];
    for (const a of region.anchors) if (!anchors.length || a - anchors[anchors.length - 1] > COL_TOL) anchors.push(a);

    const lineGaps = [];
    for (let k = 1; k < region.lines.length; k++) lineGaps.push(region.lines[k].y - region.lines[k - 1].y);
    const minGap = lineGaps.length ? Math.min(...lineGaps) : 0;
    // Lines inside one cell sit ~1.5× font size apart; rows are separated by extra padding.
    const size = region.lines[0].size;
    const rowBreak = Math.min(Math.max(minGap * 1.35, size * 1.6), size * 2.0);

    const rows = [];
    let row = null;
    let prevY = null;
    for (const line of region.lines) {
        if (!row || line.y - prevY > rowBreak) {
            row = anchors.map(() => []);
            rows.push(row);
        }
        for (const seg of line.segments) {
            const col = columnFor(anchors, seg.x);
            appendRuns(row[col], itemsToRuns(seg.items));
        }
        prevY = line.y;
    }
    const cleaned = rows.map(r => r.map(trimRuns));
    let header = null;
    if (cleaned.length > 1) {
        const first = cleaned[0];
        const isHeader = first.every(c => c.length && runsText(c).split(' ').length <= 5) && first.some(c => !c.some(r => r.code));
        if (isHeader) header = cleaned.shift();
    }
    return { type: 'table', anchors, header, rows: cleaned, page: region.lines[0].page };
}

// ───────────────────────── Text blocks ─────────────────────────

const BULLET_RE = /^([•●▪◦‣∙·*–-]|\d{1,3}[.)]|[a-z][.)])$/i;

function lineInfo(line) {
    const allItems = line.segments.flatMap(s => s.items);
    const runs = trimRuns(itemsToRuns(allItems));
    const textItems = allItems.filter(i => !i.mono);
    return {
        runs,
        text: runsText(runs),
        x: line.x,
        y: line.y,
        size: line.size,
        page: line.page,
        allBold: textItems.length > 0 && textItems.every(i => i.bold),
        firstItem: allItems[0],
        secondItem: allItems[1],
    };
}

/** Split a paragraph that starts with a bold "Label:" into a sub-heading + body (not for Q:/A:). */
function splitLeadIn(block) {
    const first = block.runs[0];
    if (!first || !first.bold) return null;
    const label = first.text.trim();
    if (!/[:.]$/.test(label) || /^(q|a|question|answer)\s*[:.]/i.test(label)) return null;
    if (label.split(/\s+/).length > 7) return null;
    const rest = trimRuns(block.runs.slice(1));
    return { label: label.replace(/[:.]$/, ''), rest };
}

function toQa(runs) {
    const first = runs[0];
    if (!first || !first.bold || !/^\s*Q\s*[:.]/i.test(first.text)) return null;
    const idx = runs.findIndex((r, k) => k > 0 && /^\s*A\s*[:.]/.test(r.text));
    if (idx === -1) return null;
    const question = trimRuns(runs.slice(0, idx));
    const answer = trimRuns(runs.slice(idx));
    if (question.length) question[0].text = question[0].text.replace(/^\s*Q\s*[:.]\s*/i, '');
    if (answer.length) answer[0].text = answer[0].text.replace(/^\s*A\s*[:.]\s*/, '');
    return { type: 'qa', question: trimRuns(question), answer: trimRuns(answer) };
}

// ───────────────────────── Document assembly ─────────────────────────

function buildDocument(rawPages) {
    if (!Array.isArray(rawPages) || !rawPages.length) return { title: '', sections: [] };
    const body = bodySize(rawPages);
    const pages = stripMargins(rawPages, body);

    // Ordered stream of table + line regions across all pages.
    const stream = [];
    pages.forEach((pg, idx) => {
        const lines = buildLines(pg, idx);
        for (const region of findRegions(lines, body)) {
            if (region.type === 'table') {
                const table = buildTable(region);
                const prev = stream[stream.length - 1];
                // Table continued on the next page: same columns → merge, dropping a repeated header row.
                if (
                    prev &&
                    prev.type === 'table' &&
                    prev.page === idx - 1 &&
                    prev.anchors.length === table.anchors.length &&
                    prev.anchors.every((a, k) => Math.abs(a - table.anchors[k]) <= COL_TOL)
                ) {
                    const sameHeader = table.header && prev.header && table.header.map(runsText).join('|') === prev.header.map(runsText).join('|');
                    if (table.header && !sameHeader) table.rows.unshift(table.header);
                    prev.rows.push(...table.rows);
                    prev.page = idx;
                } else {
                    stream.push(table);
                }
            } else {
                stream.push({ type: 'line', info: lineInfo(region.line) });
            }
        }
    });

    // Heading sizes: noticeably larger than body text.
    const headingSizes = [...new Set(stream.filter(s => s.type === 'line' && s.info.size >= body * 1.25).map(s => s.info.size))].sort((a, b) => b - a);

    // Typical line spacing of body text, for paragraph breaks.
    const gaps = [];
    for (let k = 1; k < stream.length; k++) {
        const a = stream[k - 1];
        const b = stream[k];
        if (a.type === 'line' && b.type === 'line' && a.info.page === b.info.page && Math.abs(a.info.size - body) < 0.6 && Math.abs(b.info.size - body) < 0.6) {
            gaps.push(Math.round(b.info.y - a.info.y));
        }
    }
    const leading = mode(gaps.filter(g => g > body * 0.9 && g < body * 2.2)) || body * 1.45;
    const paraBreak = leading * 1.1;

    // Pass 1: lines → raw blocks.
    const blocks = [];
    let cur = null; // open paragraph or list
    let prevLine = null;
    const close = () => {
        cur = null;
    };

    for (const entry of stream) {
        if (entry.type === 'table') {
            close();
            prevLine = null;
            blocks.push({ type: 'table', header: entry.header, rows: entry.rows });
            continue;
        }
        const info = entry.info;
        if (!info.runs.length) continue;
        const gap = prevLine && prevLine.page === info.page ? info.y - prevLine.y : Infinity;
        const pageBreak = prevLine && prevLine.page !== info.page;

        // Headings
        const hIdx = headingSizes.indexOf(info.size);
        if (hIdx !== -1) {
            const last = blocks[blocks.length - 1];
            if (cur && cur.type === 'heading' && cur.size === info.size && gap <= info.size * 1.6) {
                appendRuns(last.runs, info.runs);
            } else {
                close();
                cur = { type: 'heading', level: hIdx + 1, size: info.size, runs: [...info.runs.map(r => ({ ...r }))] };
                blocks.push(cur);
            }
            prevLine = info;
            continue;
        }

        // Bold-only short line → sub-heading
        if (info.allBold && info.text.length <= 90 && !/^Q\s*[:.]/i.test(info.text)) {
            const continuesHeading = cur && cur.type === 'subheading' && gap <= leading * 1.05 && !pageBreak;
            if (continuesHeading) appendRuns(cur.runs, info.runs);
            else {
                close();
                cur = { type: 'subheading', runs: info.runs.map(r => ({ ...r })), x: info.x };
                blocks.push(cur);
            }
            prevLine = info;
            continue;
        }

        // List items: "1." / "•" as the first item, text right after it.
        const first = info.firstItem;
        const bulletText = first && first.str.trim();
        if (bulletText && BULLET_RE.test(bulletText) && info.secondItem) {
            const ordered = /\d|[a-z]/i.test(bulletText);
            const itemRuns = stripBullet(info.runs, bulletText);
            if (!cur || cur.type !== 'list' || cur.ordered !== ordered || gap > leading * 2.2) {
                close();
                cur = { type: 'list', ordered, items: [], textX: info.secondItem.x, bulletX: first.x };
                blocks.push(cur);
            }
            cur.items.push(itemRuns);
            prevLine = info;
            continue;
        }

        // List continuation: indented to the list's text column.
        if (cur && cur.type === 'list' && Math.abs(info.x - cur.textX) <= 4 && gap <= paraBreak && !pageBreak) {
            appendRuns(cur.items[cur.items.length - 1], info.runs);
            prevLine = info;
            continue;
        }
        if (cur && cur.type === 'list' && Math.abs(info.x - cur.textX) <= 4 && pageBreak) {
            appendRuns(cur.items[cur.items.length - 1], info.runs);
            prevLine = info;
            continue;
        }

        // Paragraphs
        const startsBold = info.runs[0] && info.runs[0].bold;
        const continues =
            cur && cur.type === 'paragraph' && !startsBold && (gap <= paraBreak || (pageBreak && !/[.!?:]$/.test(runsText(cur.runs)))) && info.x >= cur.x - 4;
        if (continues) {
            appendRuns(cur.runs, info.runs);
        } else {
            close();
            cur = { type: 'paragraph', runs: info.runs.map(r => ({ ...r })), x: info.x, indent: 0 };
            blocks.push(cur);
        }
        prevLine = info;
    }

    // Pass 2: refine paragraphs (lead-in labels, Q&A) and tidy runs.
    const refined = [];
    const textIndent = mode(blocks.filter(b => b.type === 'paragraph').map(b => Math.round(b.x))) || 0;
    for (const b of blocks) {
        if (b.type === 'paragraph') {
            b.runs = trimRuns(b.runs);
            if (!b.runs.length) continue;
            const qa = toQa(b.runs);
            if (qa) {
                refined.push(qa);
                continue;
            }
            const lead = splitLeadIn(b);
            if (lead) {
                refined.push({ type: 'subheading', text: lead.label, runs: [{ text: lead.label, bold: true, code: false }] });
                if (lead.rest.length) refined.push({ type: 'paragraph', runs: lead.rest });
                continue;
            }
            refined.push({ type: 'paragraph', runs: b.runs, indented: b.x - textIndent > 8 });
        } else if (b.type === 'heading' || b.type === 'subheading') {
            b.runs = trimRuns(b.runs);
            if (b.type === 'subheading' && b.runs.length) b.runs[b.runs.length - 1].text = b.runs[b.runs.length - 1].text.replace(/\s*:$/, '');
            refined.push({ type: b.type, level: b.level, text: runsText(b.runs), runs: b.runs });
        } else if (b.type === 'list') {
            refined.push({ type: 'list', ordered: b.ordered, items: b.items.map(trimRuns).filter(r => r.length) });
        } else {
            refined.push(b);
        }
    }

    return assembleSections(refined, headingSizes.length);
}

/** Runs of a list line with its bullet / number marker removed. */
function stripBullet(runs, bullet) {
    const out = runs.map(r => ({ ...r }));
    if (out.length) {
        out[0].text = out[0].text.replace(/^\s+/, '');
        if (out[0].text.startsWith(bullet)) out[0].text = out[0].text.slice(bullet.length);
        if (!out[0].text.trim()) out.shift();
    }
    return trimRuns(out);
}

/**
 * Turn the flat block list into sections. The section level is the largest heading
 * size that occurs more than once; a single larger heading at the top becomes the title.
 */
function assembleSections(blocks, headingLevels) {
    let title = '';
    const headingCounts = {};
    for (const b of blocks) if (b.type === 'heading') headingCounts[b.level] = (headingCounts[b.level] || 0) + 1;
    let sectionLevel = null;
    for (let lvl = 1; lvl <= headingLevels; lvl++) {
        if ((headingCounts[lvl] || 0) >= 2) {
            sectionLevel = lvl;
            break;
        }
    }
    if (sectionLevel === null && headingLevels) sectionLevel = 1;

    const firstHeading = blocks.find(b => b.type === 'heading');
    if (firstHeading && firstHeading.level < (sectionLevel || Infinity)) {
        title = firstHeading.text;
        blocks = blocks.filter(b => b !== firstHeading);
    }

    const sections = [];
    let section = null;
    const ensure = () => {
        if (!section) {
            section = { title: 'Overview', blocks: [] };
            sections.push(section);
        }
        return section;
    };
    for (const b of blocks) {
        if (b.type === 'heading' && b.level === sectionLevel) {
            section = { title: b.text, blocks: [] };
            sections.push(section);
            continue;
        }
        if (b.type === 'heading') {
            // Smaller headings inside a section render as sub-headings; larger ones (rare) also.
            ensure().blocks.push({ type: 'subheading', text: b.text, runs: b.runs, level: 2 });
            continue;
        }
        ensure().blocks.push(b);
    }

    sections.forEach((s, idx) => {
        s.id = `s${idx + 1}`;
        const m = /^(block|chapter|part|section|unit|module)\s+([A-Z0-9]+)[.:)]?\s*(.*)$/i.exec(s.title);
        s.tag = m ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2]}` : '';
        s.shortTitle = m && m[3] ? m[3].replace(/\s*\((lines?|pp?\.?|pages?)\b[^)]*\)\s*$/i, '').trim() : s.title;
        const range = /\((lines?|pages?)\s+([^)]*)\)\s*$/i.exec(s.title);
        s.range = range ? `${range[1].toLowerCase()} ${range[2]}` : '';
        s.subheadings = s.blocks.filter(b => b.type === 'subheading').map(b => b.text);
    });
    return { title, sections };
}

module.exports = { parsePdfFile, buildDocument, extractPages, MAX_PDF_BYTES };
