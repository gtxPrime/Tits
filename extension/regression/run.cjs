const { chromium } = require('playwright');
const fs = require('fs'),
    http = require('http'),
    assert = require('assert');
const path = require('path'),
    os = require('os');
const root = path.resolve(__dirname, '..');
const ace = require.resolve('ace-builds/src-noconflict/ace.js');
const html = `<!doctype html><meta charset="utf-8"><title>Local paste regression fixture</title><style>body{font:16px system-ui;margin:30px;background:#f7f8fc}#editor{height:260px;width:850px;border:1px solid #bbb}textarea{display:block;width:850px;height:90px;margin:20px 0}#editable{border:1px solid #bbb;min-height:60px;width:850px}h1{font-size:24px}</style><h1>Local Ace compatibility regression</h1><p>Editable local fixture only. No portal, no submissions.</p><div id="editor"></div><textarea id="plain" aria-label="Plain text"></textarea><div id="editable" contenteditable="true"></div><div id="shadow"></div><pre id="results"></pre><script src="/ace.js"></script><script>window.editor=ace.edit('editor');editor.setOptions({useWorker:false,fontSize:16});editor.session.setMode('ace/mode/text');editor.focus(); const shadow=document.querySelector('#shadow').attachShadow({mode:'open'}); shadow.innerHTML='<textarea id="inner" aria-label="Shadow input"></textarea>';</script>`;
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/ace.js' ? 'application/javascript' : 'text/html');
    res.end(req.url === '/ace.js' ? fs.readFileSync(ace) : html);
});
(async () => {
    await new Promise(r => server.listen(8989, '127.0.0.1', r));
    const context = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'paste-regression-')), {
        channel: 'chromium',
        headless: true,
        args: ['--no-sandbox', `--disable-extensions-except=${root}`, `--load-extension=${root}`],
        permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    let errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://localhost:8989');
    await page.waitForFunction(() => window.editor && window.__TITS_UNLOCKER_ACTIVE__);
    const results = [];
    const test = async (name, fn) => {
        try {
            await fn();
            results.push({ name, pass: true });
            console.log('PASS ' + name);
        } catch (e) {
            results.push({ name, pass: false, error: String(e) });
            console.log('FAIL ' + name + ': ' + e);
        }
    };
    async function main(type, payload) {
        await page.evaluate(({ type, payload }) => window.postMessage({ source: 'TITS_UNLOCKER_ISOLATED', type, payload }, '*'), { type, payload });
        await page.waitForTimeout(40);
    }
    async function reset() {
        await main('STOP_HUMAN_TYPING', {});
        await page.evaluate(() => {
            editor.setValue('', -1);
            editor.focus();
        });
    }
    async function paste(text) {
        await page.evaluate(text => {
            const data = new DataTransfer();
            data.setData('text/plain', text);
            document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
        }, text);
        await page.waitForTimeout(50);
    }
    const text = '123456789101112\nשלום XXXXXXXX XXXXXXXXXXXX 😀\nif True:\n    print("ok")\n    print("end")';
    await test('Default Chrome MV3 loads both content scripts', async () => {
        assert(await page.evaluate(() => window.__TITS_UNLOCKER_ACTIVE__));
        assert(context.serviceWorkers().length > 0);
    });
    await test('Ace native paste preserves Unicode, digits and repeated X', async () => {
        await reset();
        await paste(text);
        assert.equal(await page.evaluate(() => editor.getValue()), text);
    });
    await test('Ace native paste replaces selection without auto-indent', async () => {
        await page.evaluate(() => {
            editor.setValue('left SELECT right', -1);
            editor.selection.setSelectionRange({ start: { row: 0, column: 5 }, end: { row: 0, column: 11 } });
            editor.focus();
        });
        await paste('a\n    b');
        assert.equal(await page.evaluate(() => editor.getValue()), 'left a\n    b right');
    });
    await test('Real Ctrl+V works using clipboardData', async () => {
        await reset();
        await page.evaluate(() => navigator.clipboard.writeText('real clipboard\n    exact'));
        await page.keyboard.press('Control+v');
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => editor.getValue()), 'real clipboard\n    exact');
    });
    await test('Typing paste preserves exact multiline Unicode with typos disabled', async () => {
        await reset();
        await main('UPDATE_CONFIG', { typingPasteEnabled: true, typingSpeed: 1, typoRate: 0 });
        await paste(text);
        await page.waitForFunction(() => !document.querySelector('#unused') && editor.getValue().endsWith('print("end")'));
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => editor.getValue()), text);
    });
    await test('Starting another typing stream cancels previous', async () => {
        await reset();
        await main('UPDATE_CONFIG', { typingSpeed: 25, typoRate: 0 });
        await main('EXECUTE_HUMAN_TYPING', { text: 'aaaaaaaaaaaaaaaaaaaa' });
        await main('EXECUTE_HUMAN_TYPING', { text: 'ZZZ' });
        await page.waitForTimeout(300);
        let value = await page.evaluate(() => editor.getValue());
        assert(value.endsWith('ZZZ'));
        assert(!value.slice(value.indexOf('Z')).includes('a'));
    });
    await test('Escape stops typing and leaves content stable', async () => {
        await reset();
        await main('EXECUTE_HUMAN_TYPING', { text: 'abcdefghijklmnopqrstuvwxyz' });
        await page.waitForTimeout(70);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(80);
        let value = await page.evaluate(() => editor.getValue());
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => editor.getValue()), value);
        assert(value.length < 26);
    });
    await test('Alt+V shortcut pastes exactly once', async () => {
        await reset();
        await main('UPDATE_CONFIG', { typingPasteEnabled: false });
        await page.evaluate(() => navigator.clipboard.writeText('shortcut-once'));
        await page.keyboard.press('Alt+v');
        await page.waitForTimeout(350);
        assert.equal(await page.evaluate(() => editor.getValue()), 'shortcut-once');
    });
    await test('Alt+Shift+V shortcut starts typing', async () => {
        await reset();
        await main('UPDATE_CONFIG', { typingPasteEnabled: false, typingSpeed: 1, typoRate: 0 });
        await page.evaluate(() => navigator.clipboard.writeText('typed command'));
        await page.keyboard.press('Alt+Shift+v');
        await page.waitForTimeout(350);
        assert.equal(await page.evaluate(() => editor.getValue()), 'typed command');
    });
    await test('Plain textarea instant paste selection', async () => {
        await main('UPDATE_CONFIG', { typingPasteEnabled: false });
        await page.locator('#plain').fill('old value');
        await page.locator('#plain').focus();
        await page.evaluate(() => document.querySelector('#plain').setSelectionRange(0, 3));
        await main('EXECUTE_FORCE_PASTE', { text: 'new' });
        assert.equal(await page.locator('#plain').inputValue(), 'new value');
    });
    await test('Plain textarea typing paste preserves newline and emoji', async () => {
        await page.locator('#plain').fill('');
        await main('UPDATE_CONFIG', { typingPasteEnabled: true, typingSpeed: 1, typoRate: 0 });
        await paste('one\ntwo 😀');
        await page.waitForTimeout(300);
        assert.equal(await page.locator('#plain').inputValue(), 'one\ntwo 😀');
    });
    await test('Shadow DOM textarea uses focused target', async () => {
        await page.locator('#shadow textarea').focus();
        await main('UPDATE_CONFIG', { typingPasteEnabled: false });
        await main('EXECUTE_FORCE_PASTE', { text: 'shadow 😀' });
        assert.equal(await page.locator('#shadow textarea').inputValue(), 'shadow 😀');
    });
    await test('Contenteditable instant paste', async () => {
        await page.locator('#editable').focus();
        await main('EXECUTE_FORCE_PASTE', { text: 'editable text' });
        assert.equal(await page.locator('#editable').innerText(), 'editable text');
    });
    await test('No JavaScript page errors', async () => assert.deepEqual(errors, []));
    fs.writeFileSync(
        path.join(__dirname, 'results.json'),
        JSON.stringify({ browser: await context.browser().version(), ace: require('ace-builds/package.json').version, results, errors }, null, 2)
    );
    await main('STOP_HUMAN_TYPING', {});
    await page.evaluate(
        ({ text, results }) => {
            editor.setValue(text, -1);
            document.querySelector('#results').textContent = results.map(r => (r.pass ? 'PASS ' : 'FAIL ') + r.name).join('\n');
        },
        { text, results }
    );
    await page.screenshot({ path: path.join(__dirname, 'local-ace-regression.png'), fullPage: true });
    await context.close();
    server.close();
    if (results.some(r => !r.pass)) process.exitCode = 1;
})().catch(e => {
    console.error(e);
    server.close();
    process.exit(1);
});
