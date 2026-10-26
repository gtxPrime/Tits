# 🔓 Ace & Universal Paste Unlocker (with Human Typing Simulator)

> **Restore paste, right-click, selection, and unlock Ace, Monaco, and CodeMirror editors on any website — including Google Cloud Shell & Console.**

[![Chrome](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#)
[![Firefox](https://img.shields.io/badge/Firefox-Add--on%20MV3-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Maintained by](https://img.shields.io/badge/maintained%20by-%40gtxPrime-8A2BE2?style=for-the-badge)](https://github.com/gtxPrime)

---

## 🌟 Key Features

### 1. 📋 Switch 1: Universal Paste & Editor Unlocker

- **Ace Editor Unlocker**: Overrides `editor.setReadOnly(true)` and `getReadOnly()`, restores stripped paste commands, unlocks `.ace_text-input`, and persists through aggressive re-lock loops.
- **Monaco & CodeMirror**: Unlocks VS Code in browser, LeetCode, HackerRank, Codility, and Cloud Workstations.
- **Neutralizes Event Suppression**: Silently drops hostile `preventDefault()` and `stopImmediatePropagation()` on clipboard events (`paste`, `beforepaste`, `copy`, `cut`, `contextmenu`, `selectstart`).
- **Bypasses Hostile Keydown Interceptors**: Defeats anti-cheat scripts that cancel `Ctrl+V`, `Cmd+V`, or `Shift+Insert`.
- **Google Cloud Console & Material Web Components**: Deep shadow-DOM traversal to locate true active inputs inside custom web components (`<cfc-text-field>`, `<mwc-textfield>`).
- **Right-Click & Selection Enabler**: Overrides `user-select: none !important` and unlocks context menus.

### 2. ⌨️ Switch 2: Human Typing Paste (Stealth Typer)

- **Automatic Interception**: When enabled, pasting anywhere in the browser (`Ctrl+V`, right-click paste) does **not** trigger any `paste` events that anti-cheat tripwires monitor.
- **Human Typing Cadence**: Types out the text character-by-character with natural speed jitter (±35%) and thinking pauses after punctuation, spaces, and newlines.
- **Realistic Typos with Backspace Fixes**: Based on a full QWERTY adjacent key map, occasionally makes realistic typos on neighboring keys (e.g. hitting 't' instead of 'r'), pauses briefly (~150ms) as a human noticing their mistake, hits `Backspace` to delete it, pauses, and types the correct letter!
- **Google Cloud Shell & Xterm.js Support**: Dispatches authentic keyboard and input event chains into `.xterm-helper-textarea` and PTY buffers.
- **Emergency Cancel**: Press <kbd>Escape</kbd> or click the on-screen badge anytime to immediately stop typing.

---

## 📥 Installation

### Google Chrome / Microsoft Edge / Brave / Opera / Arc

1. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` folder located at:
    ```
    f:\Source Codes\cheating-daddy\extension
    ```
5. The extension icon will appear in your browser toolbar!

### Mozilla Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` inside the `extension/` folder.

---

## ⌨️ Global Shortcuts

| Shortcut                                         | Action                 | Description                                                                  |
| ------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| <kbd>Alt</kbd> + <kbd>V</kbd>                    | **Force Paste**        | Pastes clipboard directly into focused editor or input                       |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Human Typing Paste** | Streams clipboard text as realistic human keystrokes with typos & backspaces |
| <kbd>Alt</kbd> + <kbd>U</kbd>                    | **Deep Unlock**        | Triggers deep unlock sweep of Ace, Monaco, inputs, and selection             |
| <kbd>Esc</kbd>                                   | **Stop Typing**        | Instantly halts active human typing stream                                   |

---

## 🧪 Testing Sandbox

You can test every restriction and feature using the included test sandbox:

1. Run `node scripts/test_server.js` from the repository root.
2. Open `http://localhost:8989/test/test-sandbox.html` in your browser.
3. Test locked Ace editor, Google Cloud Shell terminal simulation, capture-phase event blockers, keydown blockers, and shadow DOM inputs.
