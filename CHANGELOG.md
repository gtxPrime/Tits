# Changelog

All notable changes to **TITS (Test Intelligence & Tutoring System)** will be documented in this file.

---

## [v1.0.0] - 2026-10-26

### 🚀 Initial Public Launch — Everyone needs TITS during hard times

We are proud to announce the official **v1.0.0 release of TITS (Test Intelligence & Tutoring System)**!  
TITS is a fully client-side, 100% free and open-source **Bring Your Own Key (BYOK)** intelligence suite designed for real-time exam solving, interview teleprompting, and technical tutoring without subscriptions or cloud lock-in.

---

### ✨ Highlights & Features

#### 🎯 Dual Operating Modes
- **Test Mode (Exam Solver)**:
  - **Cursor-Targeted Screen Capture**: Captures an adjustable bounding box (default 850×600) centered directly at your mouse cursor.
  - **HiDPI & Multi-Monitor Support**: Physical pixel scale normalization supporting 100%, 150%, 200% DPI scaling and multi-monitor layouts with negative coordinates.
  - **Instant AI Vision Analysis**: Structured JSON schema extraction for multiple-choice questions (A through Z), coding problems, calculus, and open-ended technical queries.
  - **5 Stealth Output Channels**:
    1. **Dynamic Taskbar Tray Badge**: Real-time high-contrast emerald badge displaying the selected option letter (A–Z) directly on your Windows taskbar.
    2. **WDA-Protected Floating HUD**: Fully excluded from screen share software (Zoom, Microsoft Teams, Google Meet, Discord, WebRTC) via native Windows API `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`.
    3. **Screen Edge Pulse**: Subtle peripheral visual cues corresponding to option letters.
    4. **Low-Latency Earbud Audio**: Native Web Audio API oscillator tones mapped to option indices.
    5. **Physical Hardware CapsLock LED**: Sub-second keyboard LED blinking sequences signaling correct answers without any visible UI changes.
  - **Stealth Trigger Mechanics**: Configurable hotkeys (default `Ctrl+Alt+Q`) and stealth background mouse click-and-hold trigger.

- **Interview Mode (Live Teleprompter)**:
  - **16 kHz Dual-Stream Audio Capture**: High-fidelity capture separating system audio output and user microphone input.
  - **Real-Time Transcription & Prediction**: Continuous listening with instant AI conversational suggestion generation.
  - **Click-Through Transparent Teleprompter**: Frameless dark-glass HUD with auto-scrolling teleprompter and real-time opacity slider.

#### 🔑 100% Free BYOK Architecture
- Zero paywalls, zero token subscriptions, zero third-party telemetry.
- Direct secure local storage for Google Gemini and Groq API keys.
- **Model Hub & Quota Tracker**: Real-time remaining quota calculation, daily token counter, latency metrics, and speed vs. intelligence rankings across Gemini 2.5 Flash, Gemini Flash Latest, Gemini Pro, and Groq.

#### 🛡️ Privacy & Security
- All inference requests communicate directly between your machine and model provider APIs.
- Local JSON storage isolated in OS app data directory.
- Complete data wipe and factory reset toggle.

---

### 📦 Binary Assets & SHA-256 Checksums

| Package | Filename | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows Installer** | `Tits-1.0.0 Setup.exe` | 105 MB | `149286A76363EDF5371C047F91F121132950EA95E7262B3112DF570BEDD52BFC` |
| **Portable ZIP** | `Tits-win32-x64-1.0.0.zip` | 108 MB | `308E6381C3F6334865C9A288251E9EEAB9BABB02C5A19D16330DA232482A02FE` |
| **Squirrel Package** | `tits-1.0.0-full.nupkg` | 104 MB | `E2F4B2D2DC96241A9491E778DE9A79F1EE2CEE5BD66DAF2E6509B66A02ED1E4C` |

---

### 👤 Author
- Engineered and maintained by **[gtxPrime](https://github.com/gtxPrime)**.
