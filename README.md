# TITS — Test Intelligence & Tutoring System

> **Everyone needs TITS during hard times.**
> An undetectable, real-time AI copilot engineered for test solving, interview intelligence, and technical problem solving.

---

## Overview

**TITS** (_Test Intelligence & Tutoring System_) is an open-source, client-side, **Bring Your Own Key (BYOK)** desktop intelligence platform. It provides sub-second contextual answers to multiple-choice and short-answer questions directly under your mouse cursor, alongside live conversational teleprompting during technical interviews and high-stakes meetings.

Designed for complete stealth, security, and privacy, TITS operates with zero subscriptions, zero token limits, and zero central telemetry.

---

## Architectural Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT CAPTURE PIPELINE                   │
│  Cursor-Centered Cropper  │  System Loopback  │  Microphone │
└──────────────┬────────────────────────┬─────────────┬───────┘
               │                        │             │
               ▼                        ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                     MODEL INFERENCE CORE                    │
│   Gemini 2.5 Flash   │   Gemini 1.5 Pro   │   Llama 3.2     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEALTH OUTPUT MATRIX (M3)                  │
│  System Tray Badge │  Stealth HUD  │ Edge Pulse │ Audio Tone│
└─────────────────────────────────────────────────────────────┘
```

### 1. Cursor-Targeted Vision Pipeline

- **Sub-Second Capture**: Automatically identifies the display monitor containing the mouse pointer, captures the active screen buffer, and crops an optimized bounding box around the cursor coordinate.
- **HiDPI Aware**: Automatically scales crop dimensions across 4K, 1440p, and 1080p displays with variable OS scale factors (100% to 250%).
- **Structured JSON Schema**: Prompts multimodal vision models to output strictly formatted reasoning with option letter extraction (`A` through `E`) and confidence scoring.

### 2. Multi-Channel Stealth Output Matrix

TITS delivers solutions through four discreet communication channels:

1. **System Tray Badge**: Renders real-time 32-bit BMP badges displaying the answer option letter (`A`, `B`, `C`, `D`, `E`) directly on the Windows taskbar tray icon. Zero pixels on the active screen!
2. **Stealth Answer HUD**: Frameless floating overlay protected via OS-level capture exclusion (`SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`). Undetectable by Zoom, Microsoft Teams, Google Meet, Webex, and system screen capture utilities.
3. **Screen Edge Pulse**: Flashes the outer perimeter of the monitor $N$ times corresponding to the solution letter (1 pulse = A, 2 = B, 3 = C, 4 = D, 5 = E).
4. **Earbud Audio Blips**: Emits soft, low-amplitude sine wave audio tones directly to headphones (1 blip = A, 2 = B, etc.).

### 3. Dual Trigger Architecture

- **Global Hotkey**: Press `Ctrl+Alt+Q` (or `Cmd+Alt+Q` on macOS) from any application.
- **Click-and-Hold Trigger**: Hold down the left mouse button for 5 seconds without significant movement. Ideal for locked-down testing environments where keystroke monitoring software is deployed.

### 4. Real-Time Interview Teleprompter

- Dual-channel audio loopback capture (speaker voice + microphone input).
- Live transcription resampled to 16 kHz for low-latency question detection and response suggestions.
- Live Google search integration to augment model responses with real-time documentation and code references.

---

## Stealth & Capture Protection

TITS utilizes Windows native display affinity APIs to ensure complete invisibility during screen shares:

```c
// Native Windows API applied to application windows
SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
```

- **Screen Sharing Invisibility**: In Zoom, Teams, Meet, Discord, and Slack, the application window appears as transparent background.
- **Hardware Acceleration**: GPU-accelerated Direct3D and Vulkan rendering ensure zero CPU lag during active capture operations.
- **Zero Keystroke Trace**: Click-and-Hold mode allows complete operation without firing global keyboard hooks.

---

## Getting Started (BYOK)

TITS operates strictly on a **Bring Your Own Key** model. You interact directly with AI provider APIs from your local machine with no middleman.

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **OS**: Windows 10/11 (x64), macOS (Apple Silicon / Intel), or Linux (x64)

### Installation

```bash
# Clone the repository
git clone https://github.com/gtxPrime/Tits.git
cd Tits

# Install dependencies
npm install

# Start development instance
npm start
```

### Adding Your API Key

1. Launch TITS and navigate to **Settings (BYOK)**.
2. Enter your **Google Gemini API Key** (obtain free from [Google AI Studio](https://aistudio.google.com/app/apikey)) or **Groq API Key** (obtain from [Groq Console](https://console.groq.com/keys)).
3. Click **Save Key**. Your credentials are encrypted and stored locally in `tits-config/credentials.json`.

---

## Keyboard Shortcuts & Keybinds

| Action                     | Windows / Linux     | macOS              | Description                                     |
| :------------------------- | :------------------ | :----------------- | :---------------------------------------------- |
| **Solve Question**         | `Ctrl + Alt + Q`    | `Cmd + Alt + Q`    | Captures region near cursor and solves question |
| **Toggle Stealth Overlay** | `Ctrl + \`          | `Cmd + \`          | Toggles window visibility on/off                |
| **Toggle Click-Through**   | `Ctrl + M`          | `Cmd + M`          | Passes mouse clicks directly through the window |
| **Next Step / Prompt**     | `Ctrl + Enter`      | `Cmd + Enter`      | Takes screenshot and requests next response     |
| **Previous Response**      | `Ctrl + [`          | `Cmd + [`          | Cycles to previous AI answer                    |
| **Next Response**          | `Ctrl + ]`          | `Cmd + ]`          | Cycles to next AI answer                        |
| **Move Window**            | `Ctrl + Arrow Keys` | `Alt + Arrow Keys` | Repositions the HUD window                      |
| **Emergency Wipe & Quit**  | `Ctrl + Shift + E`  | `Cmd + Shift + E`  | Wipes active session memory and exits           |

_All keybinds are remappable in Settings._

---

## Building Standalone Executables

To compile standalone binaries for distribution:

```bash
# Build packaged executable for current platform
npm run package

# Build installer packages (EXE, Squirrel, DMG, DEB, RPM)
npm run make
```

Compiled binaries will be generated inside the `out/` directory:

- Windows: `out/TITS-win32-x64/TITS.exe`
- Installer: `out/make/squirrel.windows/x64/TITS-Setup.exe`

---

## Testing & Quality Assurance

The project includes an extensive test suite covering unit logic, multi-monitor calculations, HiDPI scaling, and error recovery:

```bash
npm test
```

Test coverage includes:

- **Screen Capture Geometry**: Bounding box clamping, negative coordinates, and multi-monitor setups.
- **Model Parser Resiliency**: JSON extraction, Markdown code block stripping, and LaTeX parsing.
- **Tray Icon Generation**: 32-bit BMP buffer generation and SVG injection sanitization.
- **BYOK Credential Sanitization**: Key trimming, quotes stripping, and storage isolation.

---

## Privacy & Local Processing

- **No Data Collection**: TITS collects zero telemetry, usage analytics, or crash reports.
- **Local Storage**: All preferences, hotkeys, and cached sessions reside exclusively in your local user directory (`AppData/Roaming/tits-config`).
- **Direct Transport**: Network packets travel directly between your machine and official Google Gemini / Groq API endpoints via TLS 1.3 encryption.

---

## License

Distributed under the **GNU General Public License v3.0**. See `LICENSE` for details.

Developed and maintained by **[gtxPrime](https://github.com/gtxPrime)**.
