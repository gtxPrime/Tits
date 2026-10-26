# 🔓 TITS Browser Companion Extension

> **Universal Paste Unblocker & Natural Human Type-Simulator for Chrome and Firefox.**
> Enables uninhibited clipboard pasting, unlocks restricted code editors (Ace, Monaco, CodeMirror), and realistically simulates human typing with physical keyboard jitter and backspace-corrected typos.

[![Version](https://img.shields.io/badge/version-1.0.0-facc15?style=for-the-badge&logoColor=black)](#)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-10b981?style=for-the-badge)](#)
[![Chrome](https://img.shields.io/badge/Chrome-Supported-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#)
[![Firefox](https://img.shields.io/badge/Firefox-Supported-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white)](#)
[![Maintained by](https://img.shields.io/badge/maintained%20by-%40gtxPrime-8A2BE2?style=for-the-badge)](https://github.com/gtxPrime)

---

## ⚡ Highlights

- **Dual-Switch Architecture**:
    1. **Paste Unblocker**: Strips hostile clipboard restrictions, unlocks `readOnly` states in Ace, Monaco, and CodeMirror, and neutralizes event suppression.
    2. **Typing Paste Simulator**: Transforms pasted clipboard text into natural human keystrokes with variable cadence, physical QWERTY typos, hesitation pauses, and automatic backspace fixes.
- **Stealth by Design**: Pure invisible background execution with zero DOM badges, zero on-screen overlays, and zero external telemetry.
- **Deep Shadow DOM Support**: Traverses nested `#shadow-root` hierarchies found in Google Cloud Console, Cloud Shell (`xterm.js`), and modern Web Components (`<cfc-text-field>`, `<mwc-textfield>`).
- **Buffer & Indentation Protection**: Clean session insertion that preserves indentation, prevents double-pasting, and excludes editor font-metric/gutter artifacts.

---

## 🎮 The Two Core Switches

### 1. 📋 Switch 1: Paste Unblocker

- **Targeted Editor Unlock**: Overrides `editor.setReadOnly(true)` and `getReadOnly()`, restores missing paste commands, and prevents aggressive re-lock loops.
- **Event Neutralization**: Safely drops `preventDefault()` and `stopImmediatePropagation()` on hostile page listeners (`paste`, `beforepaste`, `copy`, `cut`, `contextmenu`, `selectstart`) without breaking internal editor text buffers.
- **Hostile Shortcut Bypass**: Defeats keydown blockers attempting to trap or cancel `Ctrl+V`, `Cmd+V`, or `Shift+Insert`.
- **Right-Click & Selection Restoration**: Bypasses `user-select: none !important` and unlocks disabled context menus.

### 2. ⌨️ Switch 2: Typing Paste Simulator

- **Natural Cadence & Jitter**: Keystrokes are dispatched with subtle timing variance (±35%), accompanied by realistic thinking pauses after spaces, commas, periods, and newlines.
- **Authentic Typo Engine**: Utilizes a physical QWERTY keyboard adjacency map. When an error is triggered, it types the neighboring key, pauses for human realization (~120–240 ms), issues a `Backspace` to erase the mistake, pauses (~80–140 ms), and inputs the correct character.
- **Zero Typo Mode**: Slide typo frequency to `0%` for flawless, rapid natural typing.
- **Emergency Halt**: Press <kbd>Escape</kbd> or <kbd>Alt</kbd> + <kbd>X</kbd> at any point to stop typing instantly.

---

## 📥 Installation Guide

### Google Chrome / Brave / Edge / Arc / Opera (Chromium)

1. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left menu.
4. Select the `extension/` directory.
5. The extension will appear in your toolbar with an innocent terminal icon (`>_`).

### Mozilla Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` (or `manifest.firefox.json`) from the `extension/` directory.

> [!TIP]
> Use the project root build scripts to quickly switch target manifests:
>
> - `npm run ext:chrome` — Configures `manifest.json` for Chrome (Service Worker).
> - `npm run ext:firefox` — Configures `manifest.firefox.json` for Firefox (Background Scripts).

---

## ⌨️ Global Hotkeys

| Shortcut                                         | Action           | Description                                                           |
| :----------------------------------------------- | :--------------- | :-------------------------------------------------------------------- |
| <kbd>Alt</kbd> + <kbd>V</kbd>                    | **Force Paste**  | Instantly inserts clipboard text into the active editor or input      |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Typing Paste** | Streams clipboard text as realistic keystrokes with typos & fixes     |
| <kbd>Alt</kbd> + <kbd>U</kbd>                    | **Deep Unlock**  | Triggers an immediate unlock sweep across all page editors and inputs |
| <kbd>Esc</kbd> / <kbd>Alt</kbd> + <kbd>X</kbd>   | **Stop Typing**  | Immediately halts any active typing stream                            |

---

## 🧪 Interactive Test Sandbox

A local testbench is included to verify all unlock mechanisms against live hostile scripts:

1. Start the local server:
    ```bash
    node scripts/test_server.js
    ```
2. Open in your browser:
    ```text
    http://localhost:8989/test/test-sandbox.html
    ```
3. Test against:
    - Locked Ace Editor with 500ms re-lock timer.
    - Google Cloud Shell / Xterm.js terminal simulator.
    - Inline lockout attributes (`onpaste="return false;"`).
    - Capture-phase `preventDefault()` and `stopImmediatePropagation()` traps.
    - Shadow DOM encapsulated text fields.
    - Hostile keydown `Ctrl+V` interceptors.

---

## 🏛️ Architecture

```mermaid
flowchart LR
    subgraph Browser Context
        subgraph Isolated World [Isolated World: content-isolated.js]
            A[Extension APIs] <--> B[Clipboard Bridge]
            C[Hotkey Listeners] --> B
        end

        subgraph Main World [Main World: content-main.js]
            D[Deep Element Discovery] --> E[Editor Adapters]
            E --> F[Ace / Monaco / CodeMirror]
            E --> G[Xterm / Cloud Shell]
            E --> H[Shadow DOM Inputs]
            I[Event Prototype Shield] --> F
            J[Human Typing Engine] --> E
        end
    end

    B <-->|postMessage| Main World
```

- **Execution Worlds**:
    - `content-main.js` executes directly in the page's `MAIN` execution world at `document_start` to patch event prototypes and interact with native editor APIs before host scripts run.
    - `content-isolated.js` runs in the `ISOLATED` world to safely access Chrome/Firefox storage, background channels, and clipboard APIs.
- **Sanitization Pipeline**: Automatically cleans stray gutter line numbers (`12345...`) and Ace measurement strings (`הההה...`, `XXXXX...`) before any text is inserted into the document.

---

## 📋 Release Notes — v1.0.0

- Initial stable release of the TITS Universal Companion Extension under Manifest V3.
- Dual-switch interface styled with TITS Cyber Gold and Obsidian palette.
- QWERTY adjacent key typo simulator with realistic backspace correction.
- Deep shadow DOM resolution for Google Cloud Console and web terminals.
- Fixed Ace font-metrics container conflict and preserved editor indentation.
- 100% stealth design with silent in-page typing and minimal toolbar glyph (`>_`).
