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

## 📦 Artifact Details

- **Product**: `TITS - Test Intelligence & Tutoring System`
- **Version**: `v1.0.0`
- **Platform**: `win32-x64`, `darwin`, `linux`
- **Package**: `tits`
- **Unpacked Binary**: `out/TITS-win32-x64/TITS.exe`
- **Windows Installer**: `out/make/squirrel.windows/x64/TITS-1.0.0 Setup.exe`
- **License**: `GNU General Public License v3.0`
