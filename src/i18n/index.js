const en = require('./en.json');
const es = require('./es.json');
const zh = require('./zh.json');
const hi = require('./hi.json');

const dictionaries = {
    en,
    'en-US': en,
    'en-GB': en,
    es,
    'es-ES': es,
    'es-US': es,
    zh,
    'zh-CN': zh,
    'cmn-CN': zh,
    hi,
    'hi-IN': hi,
};

let currentLocale = 'en';

function setLocale(locale) {
    if (dictionaries[locale]) {
        currentLocale = locale;
    } else {
        const langCode = (locale || '').split('-')[0];
        if (dictionaries[langCode]) {
            currentLocale = langCode;
        } else {
            currentLocale = 'en';
        }
    }
}

function getLocale() {
    return currentLocale;
}

function getAvailableLocales() {
    return [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español (Spanish)' },
        { code: 'zh', name: '简体中文 (Simplified Chinese)' },
        { code: 'hi', name: 'हिन्दी (Hindi)' },
    ];
}

function t(keyPath, params = {}) {
    if (!keyPath || typeof keyPath !== 'string') return '';

    const dict = dictionaries[currentLocale] || en;
    const parts = keyPath.split('.');
    let cur = dict;

    for (const part of parts) {
        if (cur && typeof cur === 'object' && part in cur) {
            cur = cur[part];
        } else {
            cur = null;
            break;
        }
    }

    // Fallback to English if key missing in selected locale
    if (cur === null && dict !== en) {
        let fallback = en;
        for (const part of parts) {
            if (fallback && typeof fallback === 'object' && part in fallback) {
                fallback = fallback[part];
            } else {
                fallback = null;
                break;
            }
        }
        cur = fallback;
    }

    if (typeof cur !== 'string') {
        return keyPath;
    }

    let result = cur;
    for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }

    return result;
}

module.exports = {
    t,
    setLocale,
    getLocale,
    getAvailableLocales,
    dictionaries,
};
