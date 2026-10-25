# Contributing to TITS

Thank you for your interest in contributing to **TITS** (_Test Intelligence & Tutoring System_)!

TITS is an open-source, client-side, Bring Your Own Key (BYOK) desktop application engineered for test intelligence, interview assistance, and live contextual problem solving with absolute privacy.

We welcome contributions of all kinds from developers worldwide:

- Bug fixes and performance optimizations
- New language translations (i18n)
- UI / UX enhancements and theme tuning
- Documentation and guides
- Integration with additional AI providers

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Core Architectural Rule Sets](#core-architectural-rule-sets)
3. [Repository Structure](#repository-structure)
4. [Development Environment Setup](#development-environment-setup)
5. [Git Workflow & Branch Conventions](#git-workflow--branch-conventions)
6. [Code Style & Formatting Guidelines](#code-style--formatting-guidelines)
7. [Internationalization (i18n) Contribution Guide](#internationalization-i18n-contribution-guide)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Submitting a Pull Request](#submitting-a-pull-request)

---

## Code of Conduct

TITS is built around user sovereignty, privacy, and technical excellence. As a contributor, you agree to:

- Treat everyone with empathy and respect regardless of background or experience level.
- Focus on constructive, actionable code reviews and technical discussions.
- Prioritize user privacy, safety, and security above all else.

---

## Core Architectural Rule Sets

When designing, refactoring, or submitting code to TITS, all contributions **must** adhere strictly to the following core rules:

### Rule 1: Privacy by Design & Zero Telemetry

- **No Central Metrics**: Never add telemetry tracking, Google Analytics, Mixpanel, Sentry, or third-party logging pings.
- **Direct Communication Only**: Network requests must only travel directly between the local client and the user's configured AI model endpoints (Google Gemini, Groq, or local inference servers) over TLS.
- **Local Persistence Only**: All credentials, session histories, and preferences must reside strictly in the local user configuration directory (`tits-config/` or OS AppData).

### Rule 2: Non-Blocking Performance

- **Keep UI Thread Fluid**: Screen captures, audio resampling, and heavy model stream decoding must stay off the UI renderer thread.
- **Resample Audio to 16 kHz**: All audio loopback and microphone buffers must be resampled to 16 kHz before processing to avoid memory leaks and maintain low latency.
- **Dual-Stream Independence**: Microphone input and system audio loopback operate on separate channels to prevent echo feedback.

### Rule 3: Secure IPC Boundaries

- **Sanitize Across Process Boundary**: All parameters crossing the Electron `ipcMain` / `ipcRenderer` boundary must be validated, type-checked, and sanitized.
- **Context Isolation**: Maintain clean separation between renderer logic and main process capabilities.

### Rule 4: Multi-Monitor & HiDPI Aware

- **Coordinate Normalization**: Never assume a single 1080p display at origin `(0, 0)`. Secondary monitors can have negative coordinates (`X < 0` or `Y < 0`).
- **Variable DPI Scale Factors**: Display scale factors vary from 100% to 250%. All screen capture cropping and window position calculations must account for the target display's scale factor.

### Rule 5: Stealth Matrix Integrity

- **No Accidental Visibility**: Features must not compromise the capture-exclusion status (`SetWindowDisplayAffinity`).
- **Taskbar Stealth**: In stealth/hidden mode, the main window taskbar icon and frame must remain untouched so no desktop flashing gives away the user's active session.

---

## Repository Structure

```
Tits/
├── .github/                      # GitHub issue and PR templates
├── icon.png                      # Official 512x512 application icon
├── package.json                  # Dependencies, build scripts, and metadata
├── forge.config.js               # Electron Forge packaging & Squirrel config
├── src/
│   ├── index.html                # Main application HTML shell
│   ├── index.js                  # Electron main process entry point
│   ├── storage.js                # Encrypted local storage and preference engine
│   ├── audioUtils.js             # Dual-channel audio loopback and mic capture
│   ├── assets/
│   │   ├── logo.ico              # Multi-resolution Windows application icon
│   │   ├── logo.png              # High-resolution PNG logo
│   │   └── tray_icons/           # Pre-compiled A-Z and transparent tray badges
│   ├── components/               # Lit-based Web Components UI
│   │   ├── app/                  # Main App shell, header, and navigation
│   │   └── views/                # Modular view pages (Solver, Settings, History, Help)
│   ├── i18n/                     # Internationalization dictionaries (en, es, zh, hi)
│   │   ├── index.js              # Translation helper & locale manager
│   │   ├── en.json               # English master dictionary
│   │   ├── es.json               # Spanish dictionary
│   │   ├── zh.json               # Simplified Chinese dictionary
│   │   └── hi.json               # Hindi dictionary
│   └── utils/
│       ├── examSolver.js         # Multimodal reasoning & question parsing
│       ├── screenCapture.js      # Cursor-proximity screen buffer cropper
│       ├── tray.js               # Windows notification area system tray engine
│       ├── window.js             # BrowserWindow lifecycle & global shortcuts
│       └── gemini.js             # Google Gemini Live / REST client transport
└── tests/                        # Comprehensive Node.js native test suite
```

---

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **OS**: Windows 10/11 (x64), macOS (Apple Silicon / Intel), or Linux (x64)

### Setup Steps

1. **Fork the Repository** on GitHub:
   Click the **Fork** button at [https://github.com/gtxPrime/Tits](https://github.com/gtxPrime/Tits).

2. **Clone your fork locally**:

    ```bash
    git clone https://github.com/<your-username>/Tits.git
    cd Tits
    ```

3. **Install dependencies**:

    ```bash
    npm install
    ```

4. **Start the development instance**:

    ```bash
    npm start
    ```

5. **Run the test suite**:
    ```bash
    npm test
    ```

---

## Git Workflow & Branch Conventions

### Branch Naming

Create a descriptive topic branch off `master`:

- `feat/<feature-name>`: For new capabilities (e.g. `feat/tray-transparency-toggle`)
- `fix/<bug-description>`: For bug fixes (e.g. `fix/multi-monitor-hidpi-crop`)
- `i18n/<locale-code>`: For translation additions (e.g. `i18n/french-fr`)
- `docs/<topic>`: For documentation updates (e.g. `docs/screen-affinity-guide`)
- `perf/<area>`: For performance improvements (e.g. `perf/audio-resampling`)

### Commit Messages

Use the Conventional Commits specification:

```bash
git commit -m "feat(solver): add transparent idle tray block option"
git commit -m "fix(window): account for negative display offsets in multi-monitor setups"
git commit -m "i18n: add French translation dictionary"
```

---

## Code Style & Formatting Guidelines

- **Prettier**: All code must be formatted using project Prettier settings before committing:
    ```bash
    npx prettier --write .
    ```
- **Indentation**: 4 spaces.
- **Quotes**: Single quotes (`'`) for JavaScript strings; double quotes in JSON.
- **Line Length**: Print width of 150 characters.
- **Semicolons**: Always include semicolons.
- **Modern ES6+**: Use `const`/`let`, arrow functions, `async`/`await`, and destructuring. Avoid `var`.
- **Typing & Safety**: Validate inputs early; throw clear error messages.
- **Clean Separators**: Avoid em dashes in documentation and comments; use colons, bullet points, or clean hyphens.

---

## Internationalization (i18n) Contribution Guide

TITS welcomes translations into all world languages. Adding a language takes only a few minutes:

1. **Create the Dictionary File**:
   Copy `src/i18n/en.json` to `src/i18n/<locale_code>.json` (for example, `fr.json`, `de.json`, `ja.json`, `pt.json`).

2. **Translate the Strings**:
   Translate values into your target language. Keep all keys unchanged.
    - Preserve placeholder interpolation tokens like `{shortcut}`.

3. **Register the Locale**:
   In `src/i18n/index.js`, import and register your dictionary:

    ```javascript
    const fr = require('./fr.json');

    const dictionaries = {
        // ... existing locales
        fr,
        'fr-FR': fr,
    };

    function getAvailableLocales() {
        return [
            // ...
            { code: 'fr', name: 'Français (French)' },
        ];
    }
    ```

4. **Verify in Tests**:
   Add a test case in `tests/i18n.test.js` and run `npm test`.

---

## Testing & Quality Assurance

We maintain a zero-regression policy. Before opening a pull request, run:

```bash
# Run unit and integration tests
npm test
```

### Test Coverage Checklist

- **Geometry & Math**: Ensure coordinate clamping and HiDPI math are covered.
- **Parser Resilience**: Ensure unformatted text, LaTeX formulas, and Markdown code blocks parse gracefully.
- **Edge Cases**: Check negative coordinates, missing API keys, and device disconnection handling.

To add new tests, create a `.test.js` file inside the `tests/` directory using Node.js's native test runner (`node:test` and `node:assert`).

---

## Submitting a Pull Request

1. **Verify Formatting & Tests**:

    ```bash
    npx prettier --write .
    npm test
    ```

2. **Push to Your Fork**:

    ```bash
    git push origin feat/your-feature-name
    ```

3. **Open the Pull Request**:
    - Navigate to [https://github.com/gtxPrime/Tits/pulls](https://github.com/gtxPrime/Tits/pulls).
    - Click **New Pull Request** and choose your branch.
    - Fill out the Pull Request template detailing what was changed and how it was tested.
    - Link any relevant issue numbers (e.g. `Fixes #12`).

Thank you for helping make TITS the most reliable and undetectable open-source test assistant!
