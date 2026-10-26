# Paste compatibility repair, version 1.2.2

## Install Chrome / Edge

1. Extract the ZIP.
2. Open chrome://extensions (or edge://extensions) and enable Developer mode.
3. Load unpacked and choose the extracted extension folder containing manifest.json.
4. Refresh the page you want to test. Click inside the intended editor before pasting.
5. Ctrl+V uses normal paste. Alt+V inserts clipboard text. Alt+Shift+V starts typing paste. Escape or Alt+X stops typing.

The included manifest.json is now the Chrome MV3 build. A separate Firefox manifest remains included but this repair has not been validated in Firefox. Do not assume Chrome results prove Firefox support.

## Fixed

- Default Chrome manifest now uses a background service worker.
- Background shortcuts and context menu actions match content-script message names; stop command works.
- In-page shortcut fallback and command path are deduplicated.
- Startup fallback does not require an inline script or an existing document root.
- Normal Ctrl+V uses native clipboardData instead of cancelling paste and relying on permission-sensitive readText.
- Text cleanup no longer deletes valid Hebrew, numeric prefixes, or repeated X characters. Windows line endings normalize to newline.
- Ace clipboard insertion uses literal session replacement, preserving indentation instead of applying keyboard auto-indent.
- Zero typo setting is respected. Typing iteration preserves Unicode code points.

## Tested

14 local checks passed using Chromium 156.0.8078.4 and Ace 1.45.2. See regression/results.json and regression/local-ace-regression.png.

Tests cover full extension loading, real Ctrl+V, exact Unicode/multiline text, selection replacement, typing paste with typos disabled, starting a replacement stream, Escape cancellation, Alt shortcuts, textarea, contenteditable, and open shadow DOM. No JavaScript page errors occurred.

These are editable-editor compatibility tests. They do not establish compatibility with locked editors, every website, Firefox, Monaco, CodeMirror, terminal applications, or all clipboard permission states. Existing simulated typing is not trusted physical keyboard input.

## Scope

Actual third-party restricted portal execution was not verified. Local editable-Ace regression results must not be described as portal compatibility. Use only where you have permission to edit and paste.
