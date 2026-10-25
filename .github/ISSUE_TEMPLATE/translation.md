---
name: Translation Submission
about: Propose or contribute a new language translation
title: '[i18n] Add translation for <Language Name>'
labels: i18n
assignees: ''
---

**Language Details**

- Language Name: [e.g. French / 日本語 / Deutsch]
- Locale Code: [e.g. fr-FR / ja-JP / de-DE]

**Translation Checklist**

- [ ] Created dictionary in `src/i18n/<locale_code>.json`
- [ ] Preserved all nested keys from `src/i18n/en.json`
- [ ] Preserved interpolation placeholders such as `{shortcut}`
- [ ] Registered locale in `src/i18n/index.js`
- [ ] Verified tests pass with `npm test`
