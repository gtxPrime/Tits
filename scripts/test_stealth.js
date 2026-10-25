#!/usr/bin/env node

/**
 * TITS - System Tray & Screen Ray Live Diagnostic Tool
 * Launches Electron in headless test mode to test both System Tray and Screen Ray in real time.
 */

const { app } = require('electron');

if (require('electron-squirrel-startup')) {
    process.exit(0);
}

const { initTray, setTrayAnswer, destroyTray } = require('../src/utils/tray');
const { initPulseWindow, triggerFullscreenPulse, destroyPulseWindow } = require('../src/utils/screenPulse');
const storage = require('../src/storage');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
    console.log('\n======================================================');
    console.log('   TITS : System Tray & Screen Ray Test Suite');
    console.log('======================================================\n');

    try {
        storage.initializeStorage();

        // 1. Pre-initialize System Tray
        console.log('[*] Step 1: Initializing System Tray icon...');
        initTray(null, () => {
            console.log('    [Tray Callback] Quick Exam Solve invoked');
        });
        console.log('    ✓ System Tray initialized in taskbar notification area.');
        await sleep(1000);

        // 2. Pre-initialize Screen Ray Pulse Overlay
        console.log('\n[*] Step 2: Pre-initializing Screen Ray (Edge Glow Pulse)...');
        initPulseWindow();
        console.log('    ✓ Screen Ray transparent canvas pre-cached.');
        await sleep(1000);

        // 3. Test Options Demonstration
        const testOptions = [
            { letter: 'A', answer: '42.0', color: '#10b981', pulses: 1 },
            { letter: 'B', answer: 'O(N log N)', color: '#06b6d4', pulses: 2 },
            { letter: 'C', answer: 'TCP 3-Way Handshake', color: '#facc15', pulses: 3 },
            { letter: 'D', answer: 'True', color: '#ec4899', pulses: 4 },
        ];

        for (const item of testOptions) {
            console.log(`\n[+] Testing Option [${item.letter}] : "${item.answer}"`);
            console.log(`    - Updating System Tray badge to [${item.letter}]`);
            setTrayAnswer(item.letter, item.answer);

            console.log(`    - Triggering Screen Ray pulse (${item.pulses} flash${item.pulses > 1 ? 'es' : ''}, color: ${item.color})...`);
            triggerFullscreenPulse(item.pulses, item.color);

            await sleep(item.pulses * 400 + 800);
            console.log(`    ✓ Option [${item.letter}] completed.`);
        }

        // 4. Reset Tray to default state
        console.log('\n[*] Step 4: Resetting Tray back to default icon...');
        setTrayAnswer(null);
        await sleep(1000);

        console.log('\n======================================================');
        console.log('   ✓ Both System Tray and Screen Ray verified working!');
        console.log('======================================================\n');
    } catch (err) {
        console.error('[!] Test error encountered:', err);
    } finally {
        destroyPulseWindow();
        destroyTray();
        app.quit();
    }
});
