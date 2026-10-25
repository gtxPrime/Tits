const test = require('node:test');
const assert = require('node:assert');
const { t, setLocale, getLocale, getAvailableLocales } = require('../src/i18n');

test('i18n: resolves English keys accurately', () => {
    setLocale('en');
    assert.strictEqual(t('app.title'), 'TITS');
    assert.strictEqual(t('app.tagline'), 'Everyone needs TITS during hard times');
    assert.strictEqual(t('nav.settings'), 'Settings (BYOK)');
});

test('i18n: supports parameter interpolation', () => {
    setLocale('en');
    const rendered = t('solver.shortcutHint', { shortcut: 'Ctrl+Alt+Q' });
    assert.strictEqual(rendered, 'Press Ctrl+Alt+Q anywhere');
});

test('i18n: switches locales properly and falls back to English when key missing', () => {
    setLocale('es');
    assert.strictEqual(getLocale(), 'es');
    assert.strictEqual(t('nav.testMode'), 'Modo Examen');

    setLocale('zh');
    assert.strictEqual(t('nav.settings'), '设置 (BYOK)');

    setLocale('hi');
    assert.strictEqual(t('nav.settings'), 'सेटिंग्स (BYOK)');

    // Missing key in locale falls back to key path or English
    assert.strictEqual(t('nonexistent.nested.key'), 'nonexistent.nested.key');
});

test('i18n: provides available locales list', () => {
    const list = getAvailableLocales();
    assert.ok(Array.isArray(list));
    assert.ok(list.some(l => l.code === 'en'));
    assert.ok(list.some(l => l.code === 'es'));
    assert.ok(list.some(l => l.code === 'zh'));
    assert.ok(list.some(l => l.code === 'hi'));
});
