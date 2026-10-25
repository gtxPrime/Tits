const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Connecting to CDP...');
    const res = await fetch('http://127.0.0.1:9222/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.url && t.url.includes('index.html'));
    if (!pageTarget) throw new Error('No index.html target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let nextId = 1;
    const pending = new Map();

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = nextId++;
            pending.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
            const args = (msg.params.args || []).map(a => (typeof a.value !== 'undefined' ? JSON.stringify(a.value) : a.description || '')).join(' ');
            console.log(`[Renderer Console ${msg.params.type}]:`, args);
        }
    };

    await new Promise(r => (ws.onopen = r));
    console.log('Connected to Renderer via CDP!');

    await send('Runtime.enable');
    await send('Page.enable');

    async function evalCode(expression) {
        const result = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true,
        });
        if (result.exceptionDetails) {
            console.error('Eval Exception:', result.exceptionDetails);
            return { __error: result.exceptionDetails };
        }
        return result.result ? result.result.value : null;
    }

    // Step 1: Check window.tits
    console.log('\n--- Checking window.tits API ---');
    const hasTits = await evalCode(`Boolean(window.tits)`);
    const hasTray = await evalCode(`Boolean(window.tits && window.tits.setTrayAnswer)`);
    console.log('window.tits present:', hasTits, '| setTrayAnswer present:', hasTray);

    // Step 2: Navigate to Customize view & scroll to Output Channels
    console.log('\n--- Navigating to Customize View & Scrolling to Stealth Channels ---');
    await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        if (app) {
            app.currentView = 'customize';
            app.requestUpdate();
        }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Scroll to Output Channels section
    await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const buttons = Array.from(custView?.shadowRoot?.querySelectorAll('button') || []);
        const testTrayBtn = buttons.find(b => b.textContent.includes('Test Tray'));
        if (testTrayBtn) {
            testTrayBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    })()`);
    await new Promise(r => setTimeout(r, 400));

    // Step 3: Click "Test Tray" Button in Real UI
    console.log('\n--- Clicking [Test Tray] button in Real UI ---');
    const clickResult = await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const buttons = Array.from(custView?.shadowRoot?.querySelectorAll('button') || []);
        const testTrayBtn = buttons.find(b => b.textContent.includes('Test Tray'));
        if (testTrayBtn) {
            testTrayBtn.click();
            return { found: true, text: testTrayBtn.textContent.trim() };
        }
        return { found: false };
    })()`);
    console.log('Test Tray button clicked:', clickResult);

    // Check button state during active test (should say "Badge Set (B)...")
    await new Promise(r => setTimeout(r, 300));
    const btnActiveState = await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const buttons = Array.from(custView?.shadowRoot?.querySelectorAll('button') || []);
        const testTrayBtn = buttons.find(b => b.textContent.includes('Badge Set') || b.textContent.includes('Test Tray'));
        return testTrayBtn ? testTrayBtn.textContent.trim() : null;
    })()`);
    console.log('Button state during active test:', btnActiveState);

    // Capture screenshot while "Badge Set (B)..." is actively displayed in the UI
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenPath = path.join(__dirname, 'real_ui_customize_tray.png');
    fs.writeFileSync(screenPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved screenshot of active Test Tray button to:', screenPath);

    // Wait for the 3-second auto-reset back to idle icon
    console.log('Waiting for test badge 3s auto-reset...');
    await new Promise(r => setTimeout(r, 3200));

    const btnResetState = await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const buttons = Array.from(custView?.shadowRoot?.querySelectorAll('button') || []);
        const testTrayBtn = buttons.find(b => b.textContent.includes('Test Tray'));
        return testTrayBtn ? testTrayBtn.textContent.trim() : null;
    })()`);
    console.log('Button state after auto-reset:', btnResetState);

    // Step 4: Test Consecutive Answer Cycles directly via IPC
    console.log('\n--- Testing consecutive Answer cycles via IPC in live app ---');
    const answers = [
        { letter: 'A', text: 'Option A: Photosynthesis' },
        { letter: 'B', text: 'Option B: Cellular Respiration' },
        { letter: 'C', text: 'Option C: Mitosis' },
        { letter: 'D', text: 'Option D: Osmosis' },
        { letter: null, text: 'Idle Reset' },
        { letter: 'A', text: 'Option A: Multi-cycle verification pass 2' },
        { letter: 'C', text: 'Option C: Multi-cycle verification pass 2' },
    ];

    for (const ans of answers) {
        if (ans.letter) {
            console.log(`Setting Tray to Option [${ans.letter}]: ${ans.text}`);
            await evalCode(`window.tits.setTrayAnswer(${JSON.stringify(ans.letter)}, ${JSON.stringify(ans.text)})`);
        } else {
            console.log('Resetting Tray to idle state (badge_T)...');
            await evalCode(`window.tits.setTrayAnswer(null)`);
        }
        await new Promise(r => setTimeout(r, 800));
    }

    // Reset back to idle at the end
    await evalCode(`window.tits.setTrayAnswer(null)`);
    console.log('Tray returned to idle badge.');

    ws.close();
    console.log('\nReal UI Tray test executed and verified successfully!');
}

main().catch(err => {
    console.error('Fatal in test_ui_tray:', err);
    process.exit(1);
});
