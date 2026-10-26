# TITS Release Notes - v1.0.1

## 🌟 What's New in v1.0.1

### 🔄 Two-Way Remote Peer Relay (User 1 & User 2 Dual-Instance Architecture)

- **Local WebSocket Relay Server**:
    - Embedded lightweight WebSocket server (`src/utils/remoteServer.js`) listening on LAN IP/port `59432` with automatic LAN interface discovery.
    - Zero cloud dependency: traffic stays 100% on local network directly between devices.
- **Room-Based Peer Multiplexing**:
    - Dynamic room codes (e.g. `STEALTH-165`) with one-click random room generator (`🎲`).
    - Multiple browser instances join the same room; User 2 can send text from any browser/device to User 1's active exam/editor tab.
    - Live peer connection badges (`🟢 2 Peers Live` / `🟡 Solo in Room`).
    - Two-way acknowledgement loop: User 1 automatically responds with delivery feedback (`Injected into tab ✓`) back to User 2.

---

### ⌨️ Realistic Typo Engine & Auto-Backspace Correction

- **Physical QWERTY Keyboard Adjacency**:
    - When a typo is triggered according to the configured typo rate (0%–15%), the engine simulates an authentic finger slip onto an adjacent key (`a` → `s`/`q`/`z`/`w`), preserving exact capitalization.
- **Human Realization & Auto-Backpress Fix**:
    - Pauses for natural human cognitive realization delay (`120ms`–`240ms`).
    - Dispatches authentic `Backspace` keystrokes and `deleteContentBackward` events to erase the error.
    - Pauses after correction (`80ms`–`140ms`) before typing the correct intended character.
    - New **Auto-Backspace Fix** toggle switch in popup allows toggling automatic backpress correction on or off.

---

### 🎛️ Linked Remote Settings Synchronization

- **Real-Time Parameter Transmission**:
    - All typing parameters configured by the sender (`speed` in ms/char, `typoRate` in %, and `autoBackspace` state) are packaged directly into the WebSocket relay packet.
    - The receiver browser dynamically honors the sender's exact timing and typo configuration without requiring manual receiver adjustment.
- **Dynamic Live Settings Summary**:
    - Displays active parameters directly on the popup header and send button (`Speed: 65ms • Typos: 4% • Auto-Backspace: ON`).

---

### 📝 Rich-Text & TinyMCE Deep Adapter (OnlineNotepad Support)

- **TinyMCE API Hooks & Iframe Drilling**:
    - Direct integration with `window.tinymce.activeEditor.insertContent()` and `execCommand('delete')`.
    - Deep traversal into nested rich-text iframes (`#editor_ifr`, `mce-content-body`) for flawless execution on platforms like `OnlineNotepad.org`, WordPress, and web CMS editors.
- **Universal Code Editor Integration**:
    - Full support for Monaco (VS Code Web, LeetCode), Ace (HackerRank, Replit), CodeMirror, Cloud Shell (`xterm.js`), and standard HTML5 input/textarea fields.

---

### 📋 Comprehensive Diagnostic Logs & Activity Terminal

- **Integrated Activity Terminal Feed**:
    - Live terminal deck in popup with color-coded status tags (`[INFO]`, `[OK]`, `[WARN]`, `[ERR]`, `[SENT]`, `[RECV]`, `[ACK]`) and millisecond timestamps.
- **One-Click Diagnostic Export**:
    - `📋 Copy Log` copies a formatted diagnostic report (browser/OS info, relay state, paired peer count, detected tabs, settings, and chronological logs) directly to clipboard.
    - `💾 Export` saves report as a timestamped `.txt` file for debugging.

---

### 🎨 TITS Obsidian & Cyber Gold Aesthetic Overhaul

- **Unified Visual Design System**:
    - Matches the TITS desktop application design system: Obsidian Dark background (`#08090d`), Slate Surface (`#0f1118`), Elevated Cards (`#161922`), and glowing Cyber Gold Yellow accents (`#facc15`).
    - Clean typography with `Inter` and `JetBrains Mono`.
    - Glowing cyber sliders with filled progress tracks and micro-animated switches.

---

## 📦 Artifact Details (v1.0.1)

- **Product**: `TITS - Test Intelligence & Tutoring System`
- **Version**: `v1.0.1`
- **Platforms**: `win32-x64`, `darwin-x64`, `linux-x64`
- **Package**: `tits`
- **Windows Executable**: `out/Tits-win32-x64/Tits.exe`
- **Windows Installer**: `out/make/squirrel.windows/x64/Tits-1.0.1 Setup.exe`
- **macOS Archive**: `out/make/darwin/Tits-v1.0.1-darwin-x64.zip`
- **Linux Distribution**: `out/make/linux/Tits-v1.0.1-linux-x64.tar.gz`
- **Companion Extension (Chrome)**: `out/make/extension/TITS-Companion-Extension-v1.0.1-Chrome.zip`
- **Companion Extension (Firefox)**: `out/make/extension/TITS-Companion-Extension-v1.0.1-Firefox.zip`
- **Companion Extension (Universal)**: `out/make/extension/TITS-Companion-Extension-v1.0.1-Universal.zip`
- **License**: `GNU General Public License v3.0`

---

# TITS Release Notes - v1.0.0

## 🌟 What's New in v1.0.0

### 👁️ Screen Share Invisibility (Windows DWM Bypass)

- **Native Desktop Window Manager Exclusion**:
    - Employs native `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)` to completely exclude the TITS UI window from Windows DWM capture surfaces.
- **100% Invisible to Screen Sharing & Recordings**:
    - Tested and verified against Zoom Workplace, Microsoft Teams, Google Meet, Discord, Slack Huddles, OBS Studio (Display Capture), Windows Game Bar, and modern proctored testing browsers.
- **Zero Visual Artifacts**:
    - Compositor automatically renders underlying desktop pixels; remote viewers and screen recordings see an untouched screen.

---

### 🎯 Cursor-Targeted Vision Pipeline

- **Dynamic Mouse Pointer Detection**:
    - Automatically resolves which physical display currently hosts the user's cursor across multi-monitor setups.
- **Optimized Bounding Box Extraction**:
    - Crops an 850×600 region centered directly on the mouse pointer, avoiding transmission of massive 4K buffers and reducing vision token latency by over 70%.
- **HiDPI Scaling Normalization**:
    - Accurately handles display density ratios from 100% to 250% for pin-sharp optical recognition and text extraction.

---

### 📡 Multi-Channel Stealth Output Matrix

- **Taskbar Notification Area Badges (0-9, A-Z)**:
    - Answers are dynamically projected into the Windows notification tray as crisp, high-contrast letter badges.
- **Transparent Idle Mode**:
    - Toggle _"Transparent Tray When Idle"_ in Settings. The tray icon remains a 100% transparent block when waiting for questions, revealing the badge only when an answer is generated.
- **Screen Edge Pulse**:
    - Subtle monitor perimeter blinks indicate option letters (1 blink = A, 2 = B, 3 = C, 4 = D, 5 = E). Suppressed automatically when hidden or in stealth mode.
- **Earbud Sine Wave Tones**:
    - Discreet frequency tones sent directly to headphones, completely inaudible to room microphones.
- **Capture-Excluded Floating HUD**:
    - Frameless dark-mode HUD overlay showing answer details and step-by-step reasoning.

---

### ⌨️ Precision Global Hotkey Engine

- **Strict Combination Key Filtering**:
    - Hotkey triggers only execute when all designated keys in the configured combination are pressed. Normal mouse clicks, dragging, and modifier keys never trigger accidental executions.
- **Fully Remappable Keybinds**:
    - Easily reconfigure `Solve Exam Question` (`Ctrl + Alt + Q`), `Toggle Visibility` (`Ctrl + \`), `Toggle Click-Through` (`Ctrl + M`), and emergency erase hotkeys via Settings.

---

### 🌐 Multi-Language Localization (i18n)

- **Native Translation Framework**:
    - Built-in dictionary architecture with parameter interpolation and fallback to English.
- **Supported Languages**:
    - English (EN)
    - Spanish (ES)
    - Simplified Chinese (ZH)
    - Hindi (HI)

---

### 🧩 Browser Companion Extension (v1.0.0)

- **Universal Clipboard & Editor Unlocker**:
    - Complete bypass for hostile clipboard restrictions, event blockers, context menu suppression, and CSS selection disabling.
    - Deep adapter unlocking for **Ace**, **Monaco**, and **CodeMirror** editors (`setReadOnly(false)`, restoring missing paste commands) without corrupting internal buffer metrics or indentation.
    - Deep Shadow DOM traversal supporting Google Cloud Console, Cloud Shell (`xterm.js`), and modern encapsulated Web Components (`<cfc-text-field>`, `<mwc-textfield>`).
- **Human Typing Paste Simulation**:
    - Converts clipboard text into realistic, organic keyboard input with subtle cadence jitter (±35%) and thinking pauses after punctuation.
    - Physical QWERTY keyboard adjacency engine: simulates natural finger slips, hesitation pauses, backspace erasures, and self-corrections.
    - Emergency abort instantly available via <kbd>Esc</kbd> or <kbd>Alt</kbd> + <kbd>X</kbd>.
- **Stealth & Cross-Browser Architecture**:
    - Fully compatible with Manifest V3 for Chromium (Chrome, Edge, Brave, Arc, Opera) and Mozilla Firefox.
    - 100% stealth design: zero DOM badges, zero overlays, zero external telemetry, innocent terminal glyph (`>_`), and compact 260px Obsidian/Cyber Gold popup.
    - Interactive testbed sandbox included in `scripts/test_server.js` (`/test/test-sandbox.html`).
- **Global Shortcuts**:
    - `Alt + V` (Force Paste), `Alt + Shift + V` (Typing Paste), `Alt + U` (Deep Unlock), `Esc` / `Alt + X` (Stop Typing).

---

## 📦 Artifact Details (v1.0.0)

- **Product**: `TITS - Test Intelligence & Tutoring System`
- **Version**: `v1.0.0`
- **Platform**: `win32-x64`, `darwin`, `linux`
- **Package**: `tits`
- **Unpacked Binary**: `out/TITS-win32-x64/TITS.exe`
- **Windows Installer**: `out/make/squirrel.windows/x64/TITS-1.0.0 Setup.exe`
- **Companion Extension**: `extension/` (Manifest V3 for Chrome & Firefox, v1.0.0)
- **License**: `GNU General Public License v3.0`
