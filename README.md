<div align="center">

  <img src="icon.png" alt="TITS Logo" width="128" height="128" />

<div align="center">

# TITS

<p><strong>Everyone needs TITS during hard times. Undetectable, real-time AI copilot for exams, interviews, and technical problem solving.</strong></p>

<p>
  <a href="https://github.com/gtxPrime/Tits/releases/latest"><img src="https://img.shields.io/github/v/release/gtxPrime/Tits?style=for-the-badge&color=10b981&labelColor=18181b&logo=electron&logoColor=white" alt="Latest Version" /></a>
  <a href="https://github.com/gtxPrime/Tits/stargazers"><img src="https://img.shields.io/github/stars/gtxPrime/Tits?style=for-the-badge&logo=github&color=21262d&logoColor=white" alt="Stars" /></a>
  <a href="https://github.com/gtxPrime/Tits/network/members"><img src="https://img.shields.io/github/forks/gtxPrime/Tits?style=for-the-badge&logo=github&color=21262d&logoColor=white" alt="Forks" /></a>
  <a href="https://github.com/gtxPrime/Tits/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-GPL--3.0-21262d?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License" /></a>
  <a href="https://github.com/gtxPrime/Tits"><img src="https://img.shields.io/badge/Platform-Windows_%7C_macOS_%7C_Linux-21262d?style=for-the-badge&logo=windows11&logoColor=white" alt="Platform" /></a>
  <a href="https://github.com/gtxPrime/Tits/releases/latest"><img src="https://img.shields.io/github/downloads/gtxPrime/Tits/total?label=Downloads&logo=github&style=for-the-badge&color=21262d&logoColor=white" alt="Downloads" /></a>
  <a href="https://hub.xerj.org/contributors/gtxPrime"><img src="https://img.shields.io/badge/XERJ_Corpus_Hub-Contributor-8b5cf6?style=for-the-badge" alt="XERJ Corpus Hub Contributor" /></a>
</p>

</div>

  <a href="https://github.com/gtxPrime/Tits/releases/latest">
    <img src="https://raw.githubusercontent.com/gtxprime/mind-mint/main/docs/assets/github_badge.png" height="90" alt="Get it on GitHub" />
  </a>

  <h3>
    <a href="#-about-tits">About</a>
    <span> &bull; </span>
    <a href="#-recording-modes-comparison">Engine Comparison</a>
    <span> &bull; </span>
    <a href="#-screen-share-invisibility">Stealth Engine</a>
    <span> &bull; </span>
    <a href="#-features">Features</a>
    <span> &bull; </span>
    <a href="#-hotkeys">Hotkeys</a>
    <span> &bull; </span>
    <a href="#-tech-stack--architecture">Tech Stack</a>
    <span> &bull; </span>
    <a href="#-project-structure">Project Structure</a>
    <span> &bull; </span>
    <a href="#-installation--build">Installation</a>
    <span> &bull; </span>
    <a href="#-roadmap">Roadmap</a>
    <span> &bull; </span>
    <a href="#-acknowledgements">Credits</a>
    <span> &bull; </span>
    <a href="#-star-history">Star History</a>
  </h3>

</div>

---

## <a id="-about-tits"></a><img src="https://api.iconify.design/fa6-solid/brain.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="About" /><img src="https://api.iconify.design/fa6-solid/brain.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="About" /> About TITS

> [!NOTE]
> **TITS** (_Test Intelligence & Tutoring System_) is an open-source, client-side, **Bring Your Own Key (BYOK)** desktop intelligence platform. Engineered for seamless stealth, it provides sub-second contextual answers to multiple-choice and technical questions directly under your mouse cursor, alongside live conversational teleprompting during interviews and high-stakes meetings. Zero cloud intermediaries, zero subscription fees, and complete data privacy.

---

## <a id="-recording-modes-comparison"></a><img src="https://api.iconify.design/fa6-solid/scale-balanced.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Comparison" /><img src="https://api.iconify.design/fa6-solid/scale-balanced.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Comparison" /> Dual Engine & Invisibility Comparison

TITS offers distinct capture pipelines and stealth feedback mechanisms tailored to your session constraints:

| Feature / Capability                                    |     Standard Screen Share / Proctored App      |                 TITS Stealth Invisibility Engine                 |
| :------------------------------------------------------ | :--------------------------------------------: | :--------------------------------------------------------------: |
| **Detection by Screen Share (Zoom/Teams/Meet/Discord)** |  Full window visible to all call participants  |     **100% Invisible** (`WDA_EXCLUDEFROMCAPTURE` DWM bypass)     |
| **DXGI / BitBlt / Graphics.Capture Hooks**              |    Pixels captured into video stream buffer    |     **Compositor Passthrough** (renders underlying desktop)      |
| **Screen Edge Indicator**                               |      Can leak on shared display if active      |      **Suppressed in Hidden State** (Zero visual footprint)      |
| **Taskbar / Notification Area Indicator**               |           Tray icons usually visible           | **Transparent Idle Mode** (100% invisible transparent tray icon) |
| **Audio Feedback**                                      |   System audio stream could be heard on call   |   **Earbud Sine Tones** (discreet frequencies, zero mic leak)    |
| **Inference Privacy**                                   | Cloud subscription relay with stored telemetry |  **100% BYOK & Local Storage** (Zero telemetry, direct TLS 1.3)  |
| **Cost & Token Limits**                                 |     Monthly subscriptions & locked tokens      |    **Free Tier AI Studio / Groq** (Unlimited private queries)    |

---

## <a id="-screen-share-invisibility"></a><img src="https://api.iconify.design/fa6-solid/eye-slash.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Stealth Engine" /><img src="https://api.iconify.design/fa6-solid/eye-slash.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Stealth Engine" /> Screen Share Invisibility & Capture Bypass

> Native Windows Desktop Window Manager (DWM) composition bypass.

One of the most powerful capabilities of TITS is complete invisibility during live screen shares, technical interviews, and proctored sessions. When sharing your entire desktop display, meeting participants cannot see the application.

```c
// Native Windows DWM API applied to TITS window handles
SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
```

- <img src="https://api.iconify.design/fa6-solid/shield-halved.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/shield-halved.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Composition Layer Separation:** When `WDA_EXCLUDEFROMCAPTURE` (`0x00000011`) is set, the Windows DWM rendering pipeline excludes the window surface from all screen capture textures.
- <img src="https://api.iconify.design/fa6-solid/bolt.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/bolt.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Direct Frame Duplication Bypass:** Screen sharing and proctoring utilities rely on `DXGI OutputDuplication`, `BitBlt`, `GetDisplayMedia`, or `Windows.Graphics.Capture`. When these APIs query desktop pixels, Windows composits the window beneath TITS instead.
- <img src="https://api.iconify.design/fa6-solid/ghost.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/ghost.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Zero Visual Artifacts:** To observers on the call or recording, your active screen appears completely untouched.

### Screen Share Compatibility Matrix

| Platform / Utility                 |   Full Desktop Screen Share   | Single Application Share | Local Recording |
| :--------------------------------- | :---------------------------: | :----------------------: | :-------------: |
| **Zoom Workplace**                 |     Completely Invisible      |        Invisible         |    Invisible    |
| **Microsoft Teams**                |     Completely Invisible      |        Invisible         |    Invisible    |
| **Google Meet**                    |     Completely Invisible      |        Invisible         |    Invisible    |
| **Discord**                        |     Completely Invisible      |        Invisible         |    Invisible    |
| **Slack Huddles**                  |     Completely Invisible      |        Invisible         |    Invisible    |
| **OBS Studio / Streamlabs**        |     Completely Invisible      |        Invisible         |    Invisible    |
| **Windows Game Bar (Win+G)**       |     Completely Invisible      |        Invisible         |    Invisible    |
| **Proctoring / Lockdown Software** | Excluded from desktop capture |         Excluded         |    Excluded     |

---

## <a id="-features"></a><img src="https://api.iconify.design/fa6-solid/cubes.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Features" /><img src="https://api.iconify.design/fa6-solid/cubes.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Features" /> Core Features

### <img src="https://api.iconify.design/fa6-solid/user-secret.svg?color=%23ffffff#gh-dark-mode-only" height="18" align="center" alt="Stealth" /><img src="https://api.iconify.design/fa6-solid/user-secret.svg?color=%23121212#gh-light-mode-only" height="18" align="center" alt="Stealth" /> Cursor-Targeted Vision Pipeline

> Sub-second vision reasoning directly under your mouse pointer with zero screen detection.

- <img src="https://api.iconify.design/fa6-solid/crosshairs.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/crosshairs.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Cursor Proximity Crop:** Detects the physical monitor hosting your pointer and crops an optimized bounding box around your cursor instead of transmitting entire 4K buffers, cutting token latency by over 70%.
- <img src="https://api.iconify.design/fa6-solid/display.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/display.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **HiDPI Scaling Matrix:** Automatically normalizes OS scaling factors (100%, 125%, 150%, 200%, 250%) to guarantee sharp optical recognition regardless of display density.
- <img src="https://api.iconify.design/fa6-solid/microchip.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/microchip.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Multimodal Reasoning Core:** Directly interfaces with Gemini 2.5 Flash, Gemini 1.5 Pro, and Groq Llama 3.2 Vision for instant question classification and option selection.

---

### <img src="https://api.iconify.design/fa6-solid/tower-broadcast.svg?color=%23ffffff#gh-dark-mode-only" height="18" align="center" alt="Output" /><img src="https://api.iconify.design/fa6-solid/tower-broadcast.svg?color=%23121212#gh-light-mode-only" height="18" align="center" alt="Output" /> Multi-Channel Stealth Output Matrix

> Multiple concurrent, discreet channels to receive answers under strict proctoring constraints.

- <img src="https://api.iconify.design/fa6-solid/square-rss.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/square-rss.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **System Tray Badge (A-Z):** Renders answers directly into the taskbar notification area as crisp, high-contrast letter badges (`A` through `Z` and digits `0` through `9`).
- <img src="https://api.iconify.design/fa6-solid/ghost.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/ghost.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Transparent Idle Mode:** In Settings, enable _Transparent Tray When Idle_. The tray icon becomes a 100% invisible transparent block when waiting for a question. It only reveals the letter badge once the answer is solved.
- <img src="https://api.iconify.design/fa6-solid/window-maximize.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/window-maximize.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Capture-Excluded Floating HUD:** A frameless, dark-mode overlay displaying the detected answer, confidence level, and step-by-step reasoning, completely invisible to screen shares.
- <img src="https://api.iconify.design/fa6-solid/border-all.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/border-all.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Screen Edge Pulse:** The perimeter of your monitor emits subtle visual blinks corresponding to the option letter (1 blink = A, 2 blinks = B, 3 = C, 4 = D, 5 = E).
- <img src="https://api.iconify.design/fa6-solid/headphones.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/headphones.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Earbud Audio Cues:** Discreet, low-amplitude sine wave frequencies delivered directly to headphones (1 tone = A, 2 tones = B), completely inaudible to room microphones.

---

### <img src="https://api.iconify.design/fa6-solid/sliders.svg?color=%23ffffff#gh-dark-mode-only" height="18" align="center" alt="Triggers" /><img src="https://api.iconify.design/fa6-solid/sliders.svg?color=%23121212#gh-light-mode-only" height="18" align="center" alt="Triggers" /> Execution & Trigger Controls

> Precision hotkey listeners with zero mouse interference.

- <img src="https://api.iconify.design/fa6-solid/keyboard.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/keyboard.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Global Remappable Hotkeys:** Press `Ctrl + Alt + Q` (or `Alt + Cmd + Q` on macOS) from any active browser or exam window.
- <img src="https://api.iconify.design/fa6-solid/computer-mouse.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/computer-mouse.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Strict Combination Key Filtering:** TITS strictly triggers only on designated multi-key combinations, preventing regular clicks, drags, or single modifier presses from causing unwanted executions.

---

### <img src="https://api.iconify.design/fa6-solid/language.svg?color=%23ffffff#gh-dark-mode-only" height="18" align="center" alt="Localization" /><img src="https://api.iconify.design/fa6-solid/language.svg?color=%23121212#gh-light-mode-only" height="18" align="center" alt="Localization" /> Multi-Language Localization (i18n)

> Built-in internationalization architecture with fallback and parameter interpolation.

- <img src="https://api.iconify.design/fa6-solid/globe.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/globe.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Worldwide Translation Support:** Ready-to-use dictionaries for **English**, **Español (Spanish)**, **简体中文 (Simplified Chinese)**, and **हिन्दी (Hindi)** located in `src/i18n/`.
- <img src="https://api.iconify.design/fa6-solid/code-fork.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/code-fork.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Extensible Locale Engine:** Add any community dialect by dropping in a single JSON file without altering application code.

---

## <a id="-hotkeys"></a><img src="https://api.iconify.design/fa6-solid/keyboard.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Hotkeys" /><img src="https://api.iconify.design/fa6-solid/keyboard.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Hotkeys" /> Keyboard Shortcuts

All shortcuts can be reconfigured in **Settings (BYOK)**:

| Action                     |    Windows / Linux    |        macOS         | Purpose                                             |
| :------------------------- | :-------------------: | :------------------: | :-------------------------------------------------- |
| **Solve Exam Question**    |   `Ctrl + Alt + Q`    |   `Alt + Cmd + Q`    | Targets question near cursor and solves instantly   |
| **Toggle Visibility**      |      `Ctrl + \`       |      `Cmd + \`       | Instantly hides or reveals the app window           |
| **Toggle Click-Through**   |      `Ctrl + M`       |      `Cmd + M`       | Enables clicking through the app to background apps |
| **Ask Next Step / Solve**  |    `Ctrl + Enter`     |    `Cmd + Enter`     | Captures screen and requests AI follow-up           |
| **Previous Response**      |      `Ctrl + [`       |      `Cmd + [`       | Navigates to previous AI response                   |
| **Next Response**          |      `Ctrl + ]`       |      `Cmd + ]`       | Navigates to next AI response                       |
| **Scroll Response Up**     |  `Ctrl + Shift + Up`  |  `Cmd + Shift + Up`  | Scrolls response content upward                     |
| **Scroll Response Down**   | `Ctrl + Shift + Down` | `Cmd + Shift + Down` | Scrolls response content downward                   |
| **Emergency Erase & Quit** |  `Ctrl + Shift + E`   |  `Cmd + Shift + E`   | Immediately purges session from RAM and quits       |

---

## <a id="-tech-stack--architecture"></a><img src="https://api.iconify.design/fa6-solid/microchip.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Tech Stack" /><img src="https://api.iconify.design/fa6-solid/microchip.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Tech Stack" /> Tech Stack & Architecture

TITS is built strictly following modern cross-platform desktop development practices:

- **Core Runtime:** Electron 35, Chromium, Node.js
- **UI Component Layer:** Lit Elements with custom Cyber Gold & Dark Zinc design system
- **Multimodal Vision:** Google `@google/genai` (Gemini 2.5 Flash, Gemini 1.5 Pro) and Groq Llama 3.2 Vision
- **Stealth Display API:** Windows Desktop Window Manager (`SetWindowDisplayAffinity`, `WDA_EXCLUDEFROMCAPTURE`)
- **Audio Engine:** 16 kHz sample rate, non-blocking dual-stream capture, low-amplitude sine generator
- **Packaging & Distribution:** Electron Forge, Squirrel.Windows, ZIP, DMG, AppImage

---

## <a id="-project-structure"></a><img src="https://api.iconify.design/fa6-solid/folder-tree.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Structure" /><img src="https://api.iconify.design/fa6-solid/folder-tree.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Structure" /> Project Structure

```
cheating-daddy
│
├── .github/
│   ├── ISSUE_TEMPLATE/        # Standardized bug, feature, and i18n issue templates
│   └── PULL_REQUEST_TEMPLATE  # Comprehensive PR submission checklist
│
├── src/
│   ├── assets/
│   │   ├── tray_icons/        # Pre-rendered 0-9, A-Z, and transparent taskbar icons
│   │   └── onboarding/        # Vector SVGs for first-run walkthrough
│   │
│   ├── components/
│   │   ├── app/               # TitsApp root container and AppHeader
│   │   └── views/             # ExamSolverView, CustomizeView, AssistantView
│   │
│   ├── i18n/
│   │   ├── index.js           # Lightweight lookup engine with fallback and interpolation
│   │   ├── en.json            # English dictionary
│   │   ├── es.json            # Spanish (Español) dictionary
│   │   ├── zh.json            # Chinese (简体中文) dictionary
│   │   └── hi.json            # Hindi (हिन्दी) dictionary
│   │
│   ├── utils/
│   │   ├── examSolver.js      # Vision extraction, options matching, and latency logs
│   │   ├── screenCapture.js   # Cursor-proximity bounding box cropping
│   │   ├── tray.js            # Dynamic Windows taskbar notification tray manager
│   │   ├── window.js          # Native DWM capture exclusion and window affinity
│   │   ├── screenPulse.js     # Edge blink indicator orchestrator
│   │   └── gemini.js          # Direct Google GenAI API communication
│   │
│   ├── index.js               # Main Electron process, IPC orchestrator, and hotkeys
│   ├── preload.js             # Context-isolated secure IPC bridge
│   └── storage.js             # Local encrypted configuration store
│
├── tests/                     # 56+ unit and integration tests (100% passing)
├── CONTRIBUTING.md            # Guidelines, architectural principles, and PR steps
├── LICENSE                    # GNU General Public License v3.0
└── package.json               # Manifest, dependencies, and build scripts
```

---

## <a id="-installation--build"></a><img src="https://api.iconify.design/fa6-solid/screwdriver-wrench.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Installation" /><img src="https://api.iconify.design/fa6-solid/screwdriver-wrench.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Installation" /> Installation & Build

### Download Pre-Built Release

Download the latest pre-compiled installer or unpacked executable directly from [GitHub Releases](https://github.com/gtxPrime/Tits/releases/latest).

### Building from Source

1. **Clone the repository**:

    ```bash
    git clone https://github.com/gtxPrime/Tits.git
    cd Tits
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start development mode**:

    ```bash
    npm start
    ```

4. **Package standalone distributions**:
    ```bash
    # Build unpacked local binary
    npm run package

    # Build standalone installer
    npm run make
    ```

Compiled distributions will be located under `out/make/`.

---

## <a id="-roadmap"></a><img src="https://api.iconify.design/fa6-solid/map-location-dot.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Roadmap" /><img src="https://api.iconify.design/fa6-solid/map-location-dot.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Roadmap" /> Project Roadmap

- [x] **Native DWM Invisibility:** Bypass screen shares across Zoom, Teams, Meet, and Discord with `WDA_EXCLUDEFROMCAPTURE`.
- [x] **Cursor-Targeted Smart Cropping:** Instant localized screen bounds detection with HiDPI support.
- [x] **Multi-Channel Stealth Outputs:** Dynamic tray badge numbers/letters, edge blink pulse, earbud tones, and invisible idle tray mode.
- [x] **Bring Your Own Key (BYOK):** Zero subscription, client-side direct inference with Google Gemini and Groq.
- [x] **Multi-Language Dictionaries:** Integrated translation system with English, Spanish, Chinese, and Hindi.
- [ ] <img src="https://api.iconify.design/fa6-solid/shield-halved.svg?color=%23ffffff#gh-dark-mode-only" height="15" align="center" /><img src="https://api.iconify.design/fa6-solid/shield-halved.svg?color=%23121212#gh-light-mode-only" height="15" align="center" /> **Kernel-Level Input Guard [Coming Soon]:** Low-level driver-level hook suppression for environments running aggressive ring-0 proctoring engines.
- [ ] **Local Offline Vision LLM:** Native ONNX / WebGPU acceleration for completely offline question solving without internet access.
- [ ] **Hardware Bluetooth Earbud Morse Controller:** Haptic vibration cue receiver for silent answer transmission.

---

## <img src="https://api.iconify.design/fa6-solid/handshake.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Contributing" /><img src="https://api.iconify.design/fa6-solid/handshake.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Contributing" /> Contributing

Contributions are warmly welcomed! Feel free to report issues, suggest improvements, submit new translations, or open pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for full architectural standards, testing workflows, and style rules.

---

## <a id="-star-history"></a><img src="https://api.iconify.design/fa6-solid/chart-line.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Stars" /><img src="https://api.iconify.design/fa6-solid/chart-line.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Stars" /> Star History

[![Star History Chart](https://api.star-history.com/svg?repos=gtxPrime/Tits&type=Date)](https://star-history.com/#gtxPrime/Tits&Date)

## <a id="-acknowledgements"></a><img src="https://api.iconify.design/fa6-solid/heart.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="Credits" /><img src="https://api.iconify.design/fa6-solid/heart.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="Credits" /> Acknowledgements & Credits

TITS was inspired by the early concepts in [sohzm/cheating-daddy](https://github.com/sohzm/cheating-daddy). We took the core premise and completely rebuilt it into an undetectable, enterprise-grade copilot with native Windows DWM composition bypass (`WDA_EXCLUDEFROMCAPTURE`), multi-channel taskbar badge projection, HiDPI cursor-targeted vision cropping, 16 kHz dual-stream audio, and full internationalization. Sincere gratitude to the original open-source contributors.

---

## <img src="https://api.iconify.design/fa6-solid/scale-balanced.svg?color=%23ffffff#gh-dark-mode-only" height="20" align="center" alt="License" /><img src="https://api.iconify.design/fa6-solid/scale-balanced.svg?color=%23121212#gh-light-mode-only" height="20" align="center" alt="License" /> License

Distributed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for more information.

Developed and maintained with precision by **[gtxPrime](https://github.com/gtxPrime)**.
