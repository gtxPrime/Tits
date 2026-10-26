# 🔓 TITS Browser Companion Extension

> **Universal Paste Unblocker, Natural Human Type-Simulator & Cross-Device Remote Peer Relay for Chrome and Firefox.**  
> Enables uninhibited clipboard pasting, unlocks restricted code editors (Ace, Monaco, CodeMirror, TinyMCE), simulates human typing with physical keyboard jitter and backspace fixes, and allows cross-device remote text relay over a private local WebSocket connection.

[![Version](https://img.shields.io/badge/version-1.0.1-facc15?style=for-the-badge&logoColor=black)](#)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-10b981?style=for-the-badge)](#)
[![Chrome](https://img.shields.io/badge/Chrome-Supported-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#)
[![Firefox](https://img.shields.io/badge/Firefox-Supported-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white)](#)
[![Maintained by](https://img.shields.io/badge/maintained%20by-%40gtxPrime-8A2BE2?style=for-the-badge)](https://github.com/gtxPrime)

---

## ⚡ Highlights in v1.0.1

- **🔄 Two-Way Remote Peer Relay**:
    - Dual-user architecture: **User 1** opens the target exam or editor tab; **User 2** types or pastes text remotely from another browser, phone, or laptop.
    - Zero cloud dependency: streams directly across your local network via high-speed WebSocket rooms (`ws://<LAN_IP>:59432`).
    - Bidirectional delivery loop: User 1 automatically responds with instant peer acknowledgments (`Injected into tab ✓`).
- **🎛️ Linked Remote Settings Synchronization**:
    - Typing speed (ms/char), typo frequency (%), and auto-backspace state are packaged into each relay payload. The receiver executes with the sender's exact settings automatically.
- **⌨️ Realistic Typo Engine & Auto-Backspace Correction**:
    - Physical QWERTY keyboard adjacency map simulates authentic finger slips with matching capitalization.
    - Human realization pauses (`120ms`–`240ms`) followed by authentic `Backspace` keystrokes and self-corrections.
    - Dedicated **Auto-Backspace Fix** toggle switch in the popup.
- **📝 TinyMCE & Rich-Text Deep Adapter**:
    - Direct integration with `window.tinymce.activeEditor` and iframe document drilling (`#editor_ifr`, `mce-content-body`) for flawless execution on platforms like `OnlineNotepad.org`, WordPress, and web CMS tools.
- **📋 Diagnostic Terminal & Instant Report Export**:
    - Monospace activity feed with color-coded tags (`[INFO]`, `[OK]`, `[WARN]`, `[ERR]`, `[SENT]`, `[RECV]`, `[ACK]`).
    - One-click clipboard copy (`📋 Copy`) and timestamped `.txt` download (`💾 Export`) for instant troubleshooting.
- **🎨 TITS Obsidian & Cyber Gold Aesthetic**:
    - Directly styled after the TITS desktop application design system (`#08090d`, `#0f1118`, `#161922`, `#facc15`).

---

## 🎮 The Three Core Switches

### 1. 📋 Switch 1: Paste Unblocker
- **Targeted Editor Unlock**: Overrides `editor.setReadOnly(true)` and `getReadOnly()`, restores missing paste commands, and prevents aggressive re-lock loops.
- **Event Neutralization**: Drops `preventDefault()` and `stopImmediatePropagation()` on hostile page listeners (`paste`, `beforepaste`, `copy`, `cut`, `contextmenu`, `selectstart`).
- **Hostile Shortcut Bypass**: Defeats keydown blockers attempting to trap `Ctrl+V`, `Cmd+V`, or `Shift+Insert`.
- **Right-Click & Selection Restoration**: Bypasses `user-select: none !important` and unlocks disabled context menus.

### 2. ⌨️ Switch 2: Typing Simulation
- **Natural Cadence & Jitter**: Keystrokes are dispatched with subtle timing variance (±35%), accompanied by realistic thinking pauses after spaces, commas, periods, and newlines.
- **Authentic Typo Engine**: Uses a physical QWERTY keyboard adjacency map. When an error is triggered, it types the neighboring key, pauses for human realization, issues a `Backspace` erasure, pauses, and types the correct character.
- **Adjustable Parameters**: Keystroke speed slider (`20ms` to `130ms`) and typo rate slider (`0%` to `15%`).

### 3. 🔙 Switch 3: Auto-Backspace Fix
- Automatically erases mistakes and re-types the correct character.
- When toggled off, typo characters remain in place without backspacing.

---

## 📡 Remote Peer Relay Setup

```
┌─────────────────────────┐               ┌─────────────────────────┐
│     User 2 (Sender)     │               │   User 1 (Receiver)     │
│ Secondary Browser / Tab │               │ Exam / Restricted Page  │
└────────────┬────────────┘               └────────────▲────────────┘
             │                                         │
             │   1. WebSocket Payload                  │  3. Injected into Tab
             │   { text, mode, delay, typoRate }       │     (Paste or Type)
             ▼                                         │
    ┌──────────────────────────────────────────────────┴─────┐
    │       Local TITS WebSocket Server (Port 59432)          │
    │         Room Multiplexer: e.g. "STEALTH-165"           │
    └────────────────────────────────────────────────────────┘
```

1. **Start the TITS Server**: Ensure the TITS desktop application is running (or `node src/utils/remoteServer.js`).
2. **Find Server URL**: In TITS Settings, note the local WebSocket URL (e.g. `ws://192.168.1.6:59432` or `ws://127.0.0.1:59432`).
3. **Connect Receiver (User 1)**:
   - Open popup, enter Server URL and Room Code (e.g. `STEALTH-165`).
   - Click **Connect**. The badge will display `🟡 Solo in Room`.
   - Open your target exam, editor, or notepad tab.
4. **Connect Sender (User 2)**:
   - In another browser instance or device on the same LAN, open popup with the same Server URL and Room Code.
   - Click **Connect**. Both badges will turn `🟢 2 Peers Live`.
5. **Send Text**:
   - Select remote mode: `⚡ Instant Paste` or `⌨ Simulated Typing`.
   - Type or paste text in the textarea and press **Send** (or <kbd>Alt</kbd>+<kbd>Enter</kbd>).
   - Text is injected directly into User 1's active tab, and User 2 receives instant feedback (`Peer feedback: Injected into tab ✓`).

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
> Use the project root build scripts to switch target manifests:
> - `npm run ext:chrome` — Configures `manifest.json` for Chrome (Service Worker).
> - `npm run ext:firefox` — Configures `manifest.firefox.json` for Firefox (Background Scripts).

---

## ⌨️ Global Hotkeys

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>V</kbd> | **Force Paste** | Instantly inserts clipboard text into the active editor or input |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Typing Paste** | Streams clipboard text as realistic keystrokes with typos & fixes |
| <kbd>Alt</kbd> + <kbd>U</kbd> | **Deep Unlock** | Triggers an immediate unlock sweep across all page editors and inputs |
| <kbd>Esc</kbd> / <kbd>Alt</kbd> + <kbd>X</kbd> | **Stop Typing** | Immediately halts any active typing stream |
| <kbd>Alt</kbd> + <kbd>Enter</kbd> | **Remote Send** | Instantly transmits text from the popup to peer tab |

---

## 📋 Release Notes — v1.0.1

- Two-way remote peer relay over private local WebSocket rooms.
- Linked typing parameters: sender's speed, typo rate, and auto-backspace synchronized in real-time.
- TinyMCE editor adapter and iframe document drilling supporting OnlineNotepad.org.
- Full auto-backspace engine in both main world and background direct script injectors.
- Diagnostic activity terminal with one-click clipboard copy and file export.
- Complete visual overhaul matching TITS Obsidian & Cyber Gold design system.
