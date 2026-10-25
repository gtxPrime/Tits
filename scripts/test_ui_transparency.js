const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Connecting to CDP at http://127.0.0.1:9222...');
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
            console.log(`[Renderer Console]:`, args);
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

    // Step 1: Check window.tits transparency methods
    console.log('\n--- Checking window.tits Window Opacity API ---');
    const hasSetOpacity = await evalCode(`Boolean(window.tits && typeof window.tits.setWindowOpacity === 'function')`);
    const hasGetOpacity = await evalCode(`Boolean(window.tits && typeof window.tits.getWindowOpacity === 'function')`);
    console.log('window.tits.setWindowOpacity present:', hasSetOpacity);
    console.log('window.tits.getWindowOpacity present:', hasGetOpacity);

    // Initial opacity
    const initialRes = await evalCode(`window.tits.getWindowOpacity()`);
    console.log('Initial Window Opacity via IPC:', initialRes);

    // Step 2: Navigate to Customize view & scroll to Appearance section
    console.log('\n--- Navigating to Customize View & Scrolling to Window Transparency Slider ---');
    await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        if (app) {
            app.currentView = 'customize';
            app.requestUpdate();
        }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Scroll to slider
    await evalCode(`(() => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const sliders = Array.from(custView?.shadowRoot?.querySelectorAll('input[type="range"]') || []);
        const transSlider = sliders.find(s => s.closest('.slider-wrap')?.textContent.includes('Window Transparency'));
        if (transSlider) {
            transSlider.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    })()`);
    await new Promise(r => setTimeout(r, 400));

    // Step 3: Test Slider Adjustment to 0.60 (60% opacity)
    console.log('\n--- Adjusting Slider to 0.60 (60% Opacity) ---');
    const slider60Result = await evalCode(`(async () => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const sliders = Array.from(custView?.shadowRoot?.querySelectorAll('input[type="range"]') || []);
        const transSlider = sliders.find(s => s.closest('.slider-wrap')?.textContent.includes('Window Transparency'));
        if (transSlider) {
            transSlider.value = '0.60';
            transSlider.dispatchEvent(new Event('input', { bubbles: true }));
            return { success: true, value: transSlider.value };
        }
        return { success: false };
    })()`);
    console.log('Slider dispatched 0.60:', slider60Result);
    await new Promise(r => setTimeout(r, 600));

    const opacityAt60 = await evalCode(`window.tits.getWindowOpacity()`);
    console.log('Actual BrowserWindow Opacity at 60%:', opacityAt60);

    // Step 4: Test Slider Adjustment to 0.40 (40% opacity)
    console.log('\n--- Adjusting Slider to 0.40 (40% Opacity) ---');
    await evalCode(`(async () => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const sliders = Array.from(custView?.shadowRoot?.querySelectorAll('input[type="range"]') || []);
        const transSlider = sliders.find(s => s.closest('.slider-wrap')?.textContent.includes('Window Transparency'));
        if (transSlider) {
            transSlider.value = '0.40';
            transSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const opacityAt40 = await evalCode(`window.tits.getWindowOpacity()`);
    console.log('Actual BrowserWindow Opacity at 40%:', opacityAt40);

    // Step 5: Capture Screenshot of the UI at 0.40 opacity
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenPath = path.join(__dirname, 'real_ui_transparency_slider.png');
    fs.writeFileSync(screenPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved screenshot of active Transparency slider to:', screenPath);

    // Step 6: Restore Slider to standard 0.85 (85% Opacity)
    console.log('\n--- Restoring Slider to 0.85 (85% Opacity) ---');
    await evalCode(`(async () => {
        const app = document.querySelector('tits-app');
        const custView = app?.shadowRoot?.querySelector('customize-view');
        const sliders = Array.from(custView?.shadowRoot?.querySelectorAll('input[type="range"]') || []);
        const transSlider = sliders.find(s => s.closest('.slider-wrap')?.textContent.includes('Window Transparency'));
        if (transSlider) {
            transSlider.value = '0.85';
            transSlider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const opacityAt85 = await evalCode(`window.tits.getWindowOpacity()`);
    console.log('Actual BrowserWindow Opacity restored to 85%:', opacityAt85);

    ws.close();
    console.log('\nReal UI Transparency verification completed successfully!');
}

main().catch(err => {
    console.error('Fatal in test_ui_transparency:', err);
    process.exit(1);
});
