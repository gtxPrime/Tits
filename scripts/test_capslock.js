#!/usr/bin/env node

/**
 * TITS - Caps Lock Indicator Hardware Test Utility
 * Tests physical keyboard LED pulse and toggle capabilities without launching full UI.
 */

const { pulseCapsLock, toggleCapsLock, triggerCapsLockAnswer, letterToCount } = require('../src/utils/capsLock');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
    console.log('\n======================================================');
    console.log('   TITS : Keyboard Caps Lock LED Indicator Test');
    console.log('======================================================\n');
    console.log('[*] Testing physical Caps Lock LED blinks across options:');

    const optionsToTest = ['A', 'B', 'C', 'D'];

    for (const opt of optionsToTest) {
        const blinks = letterToCount(opt);
        console.log(`\n[+] Triggering option "${opt}" (${blinks} blink${blinks > 1 ? 's' : ''})...`);
        triggerCapsLockAnswer(opt, 'pulse');
        // Wait for the pulse sequence to complete before next option
        await sleep(blinks * 400 + 400);
        console.log(`    ✓ Option "${opt}" sequence finished.`);
    }

    console.log('\n[+] Testing direct toggle mode...');
    toggleCapsLock();
    await sleep(800);
    toggleCapsLock();
    console.log('    ✓ Direct toggle completed.');

    console.log('\n======================================================');
    console.log('   ✓ Caps Lock LED indicator test completed safely!');
    console.log('   Physical keyboard state restored.');
    console.log('======================================================\n');
}

runDemo().catch(err => {
    console.error('[!] Test encountered an error:', err);
    process.exit(1);
});
