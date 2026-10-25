const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const debugLogger = require('../src/utils/debugLogger');

test('debugLogger: returns valid log file path ending with logs.txt', () => {
    const logPath = debugLogger.getLogPath();
    assert.ok(typeof logPath === 'string');
    assert.ok(logPath.endsWith('logs.txt'));
});

test('debugLogger: initializes diagnostic report and writes log entries', () => {
    debugLogger.init();
    debugLogger.info('TestCategory', 'Test diagnostic message', { status: 'ok', num: 42 });
    debugLogger.warn('TestCategory', 'Test warning message');
    debugLogger.error('TestCategory', 'Test error message', { error: 'mock error' });

    const content = debugLogger.getLogContent();
    assert.ok(typeof content === 'string');
    assert.ok(content.includes('TITS (Test Intelligence & Tutoring System)'));
    assert.ok(content.includes('[ENVIRONMENT & OPERATING SYSTEM]'));
    assert.ok(content.includes('Test diagnostic message'));
    assert.ok(content.includes('Test error message'));
});

test('debugLogger: getRecentLogs returns buffered array of log lines', () => {
    const recent = debugLogger.getRecentLogs(10);
    assert.ok(Array.isArray(recent));
    assert.ok(recent.length > 0);
});
