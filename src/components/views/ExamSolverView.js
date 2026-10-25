import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { icons } from '../../utils/icons.js';

export class ExamSolverView extends LitElement {
    static properties = {
        isSolving: { type: Boolean },
        statusMessage: { type: String },
        lastResult: { type: Object },
        examTriggerMode: { type: String },
        examCaptureRegion: { type: String },
        enableTrayOutput: { type: Boolean },
        enableHudOutput: { type: Boolean },
        enableScreenPulse: { type: Boolean },
        enableAudioBeeps: { type: Boolean },
        solveKeybind: { type: String },
        hasApiKey: { type: Boolean },
        errorMessage: { type: String },
    };

    static styles = css`
        * {
            box-sizing: border-box;
            font-family: var(--font, system-ui, sans-serif);
            margin: 0;
            padding: 0;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            background: #0d0e13;
            color: #f3f4f6;
        }

        /* Material You Centered Container with proper margins */
        .m3-container {
            width: 100%;
            max-width: 1000px;
            margin: 0 auto;
            padding: 24px 32px 50px 32px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* ── M3 Hero Surface ── */
        .m3-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px 28px;
            background: #161722;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 24px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            gap: 24px;
        }

        .m3-hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.35), transparent);
        }

        .hero-left {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 1;
        }

        .hero-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 14px;
            border-radius: 999px;
            background: rgba(250, 204, 21, 0.12);
            border: 1px solid rgba(250, 204, 21, 0.28);
            font-size: 11px;
            font-weight: 700;
            color: #fde047;
            width: fit-content;
            letter-spacing: 0.4px;
        }

        .pulse-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #facc15;
            box-shadow: 0 0 8px #facc15;
        }

        .hero-title {
            font-size: 21px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
        }

        .hero-desc {
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.5;
            max-width: 520px;
        }

        .m3-primary-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 22px;
            border-radius: 999px;
            background: #facc15;
            border: 1px solid #facc15;
            color: #181503;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            box-shadow:
                0 1px 3px rgba(0, 0, 0, 0.3),
                0 2px 6px rgba(250, 204, 21, 0.2);
            flex-shrink: 0;
        }

        .m3-primary-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            background: #fde047;
            border-color: #fde047;
            box-shadow:
                0 4px 12px rgba(0, 0, 0, 0.35),
                0 2px 8px rgba(250, 204, 21, 0.3);
        }

        .m3-primary-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .kbd-capsule {
            padding: 3px 8px;
            border-radius: 999px;
            background: rgba(0, 0, 0, 0.12);
            font-family: var(--font-mono, monospace);
            font-size: 11px;
            font-weight: 700;
            color: #181503;
        }

        .kbd-inline {
            padding: 2px 7px;
            border-radius: 6px;
            background: #22232d;
            border: 1px solid rgba(255, 255, 255, 0.08);
            font-family: var(--font-mono, monospace);
            font-size: 11px;
            font-weight: 600;
            color: #facc15;
        }

        /* ── M3 Section ── */
        .section-header {
            font-size: 12px;
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .channels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 14px;
        }

        .channel-card {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 18px;
            background: #161722;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        }

        .channel-card:hover {
            background: #1c1d2a;
            border-color: rgba(250, 204, 21, 0.22);
            transform: translateY(-2px);
        }

        .channel-card.active {
            border-color: rgba(250, 204, 21, 0.28);
            background: #191b26;
        }

        .channel-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border-radius: 12px;
            background: rgba(250, 204, 21, 0.1);
            color: #facc15;
            flex-shrink: 0;
        }

        .channel-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
            flex: 1;
        }

        .channel-name {
            font-size: 13px;
            font-weight: 700;
            color: #f9fafb;
        }

        .channel-desc {
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.35;
        }

        /* Authentic M3 Switch */
        .m3-switch {
            width: 44px;
            height: 24px;
            border-radius: 999px;
            background: #232430;
            border: 2px solid #494a5a;
            position: relative;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
            flex-shrink: 0;
            margin-top: 2px;
        }

        .m3-switch::after {
            content: '';
            position: absolute;
            top: 3px;
            left: 3px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #9ca3af;
            transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
        }

        .m3-switch.active {
            background: #facc15;
            border-color: #facc15;
        }

        .m3-switch.active::after {
            transform: translateX(20px);
            background: #181503;
        }

        /* ── M3 Result Surface ── */
        .m3-result-card {
            display: flex;
            flex-direction: column;
            background: #171821;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.35);
        }

        .result-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 24px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .result-title-group {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .m3-letter-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 16px;
            background: #facc15;
            font-size: 26px;
            font-weight: 900;
            color: #1a1500;
            box-shadow: 0 2px 14px rgba(250, 204, 21, 0.3);
        }

        .m3-letter-badge.none {
            background: #242531;
            font-size: 12px;
            font-weight: 700;
            color: #9ca3af;
            box-shadow: none;
            width: auto;
            padding: 0 16px;
        }

        .result-meta {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .result-type-tag {
            font-size: 12px;
            font-weight: 700;
            color: #facc15;
            letter-spacing: 0.4px;
        }

        .result-timestamp {
            font-size: 11px;
            color: #6b7280;
        }

        .btn-tonal {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 999px;
            background: #242531;
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #f3f4f6;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-tonal:hover {
            background: rgba(250, 204, 21, 0.15);
            color: #facc15;
            border-color: rgba(250, 204, 21, 0.3);
        }

        .result-body {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .answer-container {
            background: rgba(250, 204, 21, 0.05);
            border: 1px solid rgba(250, 204, 21, 0.2);
            border-radius: 18px;
            padding: 18px 20px;
        }

        .answer-label {
            font-size: 11px;
            font-weight: 700;
            color: #facc15;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 6px;
        }

        .answer-text {
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.5;
            user-select: text;
            cursor: text;
        }

        .explanation-container {
            padding: 16px 20px;
            background: #1c1d27;
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .explanation-label {
            font-size: 11px;
            font-weight: 700;
            color: #9ca3af;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }

        .explanation-text {
            font-size: 13px;
            color: #d1d5db;
            line-height: 1.6;
            user-select: text;
            cursor: text;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 50px 24px;
            text-align: center;
            gap: 14px;
        }

        .radar-box {
            position: relative;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(250, 204, 21, 0.04);
            border: 1px dashed rgba(250, 204, 21, 0.3);
            color: #facc15;
        }

        .empty-state-title {
            font-size: 15px;
            font-weight: 700;
            color: #e5e7eb;
        }

        .empty-state-desc {
            font-size: 12px;
            color: #9ca3af;
            max-width: 420px;
            line-height: 1.5;
        }

        /* ── M3 BYOK Footer Pill ── */
        .byok-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            background: #171821;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 18px;
            font-size: 12px;
            color: #9ca3af;
        }

        .byok-pill {
            font-weight: 700;
            color: #facc15;
            background: rgba(250, 204, 21, 0.12);
            padding: 3px 10px;
            border-radius: 999px;
            border: 1px solid rgba(250, 204, 21, 0.25);
            font-size: 11px;
        }

        .byok-link {
            color: #facc15;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
        }

        .byok-link:hover {
            color: #ffffff;
        }

        .m3-error-banner {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 18px;
            border-radius: 16px;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .action-btn-secondary {
            background: #242531;
            color: #f3f4f6;
            font-weight: 600;
            font-size: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 999px;
            padding: 7px 15px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .action-btn-secondary:hover {
            background: rgba(250, 204, 21, 0.15);
            border-color: rgba(250, 204, 21, 0.3);
            color: #facc15;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.15s ease;
        }

        .icon-btn:hover {
            color: #f3f4f6;
            background: rgba(255, 255, 255, 0.08);
        }
    `;

    constructor() {
        super();
        this.isSolving = false;
        this.statusMessage = '';
        this.lastResult = null;
        this.examTriggerMode = 'hotkey';
        this.examCaptureRegion = 'cursor_crop';
        this.enableTrayOutput = true;
        this.enableHudOutput = true;
        this.enableScreenPulse = true;
        this.enableAudioBeeps = true;
        this.solveKeybind = 'Ctrl+Alt+Q';
        this.hasApiKey = true;
        this.errorMessage = '';
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.loadSettings();
    }

    async loadSettings() {
        if (!window.tits || !window.tits.storage) return;
        try {
            const prefs = (await window.tits.storage.getPreferences()) || {};
            const keybinds = (await window.tits.storage.getKeybinds()) || {};
            const creds = (await window.tits.storage.getCredentials()) || {};

            this.examTriggerMode = prefs.examTriggerMode || 'hotkey';
            this.examCaptureRegion = prefs.examCaptureRegion || 'cursor_crop';
            this.enableTrayOutput = prefs.enableTrayOutput !== false;
            this.enableHudOutput = prefs.enableHudOutput !== false;
            this.enableScreenPulse = prefs.enableScreenPulse !== false;
            this.enableAudioBeeps = prefs.enableAudioBeeps !== false;
            this.solveKeybind = keybinds.solveExam || (process.platform === 'darwin' ? 'Alt+Cmd+Q' : 'Ctrl+Alt+Q');
            this.hasApiKey = Boolean(creds.apiKey || creds.groqApiKey);
        } catch (e) {
            console.error('Error loading solver settings:', e);
        }
    }

    async toggleChannel(channelName) {
        this[channelName] = !this[channelName];
        if (window.tits && window.tits.storage) {
            await window.tits.storage.updatePreference(channelName, this[channelName]);
        }
        this.requestUpdate();
    }

    async triggerSolve() {
        if (this.isSolving) return;
        this.isSolving = true;
        this.statusMessage = 'Capturing & solving...';
        this.errorMessage = '';
        this.requestUpdate();

        try {
            if (window.tits && window.tits.solveExam) {
                const res = await window.tits.solveExam({ mode: this.examCaptureRegion });
                if (res && res.success) {
                    this.lastResult = res;
                    this.errorMessage = '';
                } else if (res && res.error) {
                    this.errorMessage = res.error;
                }
            }
        } catch (err) {
            console.error('Error in triggerSolve:', err);
            this.errorMessage = err.message || 'Failed to trigger exam solve.';
        } finally {
            this.isSolving = false;
            this.statusMessage = '';
            this.requestUpdate();
        }
    }

    openSettings() {
        const app = window.titsApp || document.querySelector('tits-app');
        if (app && typeof app.navigate === 'function') {
            app.navigate('customize');
        } else if (app) {
            app.currentView = 'customize';
            app.requestUpdate();
        }
    }

    copyAnswer() {
        if (!this.lastResult || !this.lastResult.answer) return;
        const textToCopy = this.lastResult.letter ? `Option [${this.lastResult.letter}]: ${this.lastResult.answer}` : this.lastResult.answer;
        navigator.clipboard.writeText(textToCopy);
    }

    clearResult() {
        this.lastResult = null;
        if (window.tits && window.tits.clearTrayAnswer) {
            window.tits.clearTrayAnswer();
        }
    }

    navigateToSettings() {
        const app = document.querySelector('tits-app') || document.querySelector('tits-app');
        if (app && app.navigate) {
            app.navigate('customize');
        }
    }

    render() {
        return html`
            <div class="m3-container">
                <!-- M3 Hero Surface -->
                <div class="m3-hero">
                    <div class="hero-left">
                        <div class="hero-pill">
                            <span class="pulse-dot"></span>
                            <span>Pure BYOK · Undetectable Capture</span>
                        </div>
                        <h2 class="hero-title">Cursor-Targeted Question Solver</h2>
                        <p class="hero-desc">
                            Hover your cursor over any question or prompt on screen and press
                            <span class="kbd-inline">${this.solveKeybind}</span>. High-speed vision extracts options and solves instantly.
                        </p>
                    </div>
                    <button
                        class="m3-primary-btn"
                        ?disabled=${this.isSolving}
                        @click=${() => this.triggerSolve()}
                        title="Target question near cursor and solve"
                    >
                        ${icons.zap(16)}
                        <span>${this.isSolving ? 'Solving...' : 'Target & Solve Now'}</span>
                        <span class="kbd-capsule">${this.solveKeybind}</span>
                    </button>
                </div>

                <!-- Error Notification Banner (Non-blocking) -->
                ${
                    this.errorMessage
                        ? html`
                              <div class="m3-error-banner">
                                  <span style="color:#ef4444;display:flex;align-items:center;">${icons.alert(20)}</span>
                                  <div style="flex:1;font-size:12.5px;color:#fecaca;line-height:1.45;font-weight:500;">${this.errorMessage}</div>
                                  <button class="action-btn-secondary" @click=${() => this.openSettings()}>
                                      <span>Open Settings (BYOK)</span>
                                      ${icons.arrowUpRight(11)}
                                  </button>
                                  <button
                                      class="icon-btn"
                                      title="Dismiss"
                                      @click=${() => {
                                          this.errorMessage = '';
                                          this.requestUpdate();
                                      }}
                                  >
                                      ${icons.x(14)}
                                  </button>
                              </div>
                          `
                        : ''
                }

                <!-- Stealth Output Channels Matrix -->
                <div>
                    <div class="section-header">
                        <span>Stealth Output Channels</span>
                    </div>
                    <div class="channels-grid">
                        <div class="channel-card ${this.enableTrayOutput ? 'active' : ''}" @click=${() => this.toggleChannel('enableTrayOutput')}>
                            <div class="channel-icon">${icons.pin(18)}</div>
                            <div class="channel-info">
                                <span class="channel-name">System Tray Badge</span>
                                <span class="channel-desc">Displays option letter [A-Z] on taskbar tray</span>
                            </div>
                            <div class="m3-switch ${this.enableTrayOutput ? 'active' : ''}"></div>
                        </div>

                        <div class="channel-card ${this.enableHudOutput ? 'active' : ''}" @click=${() => this.toggleChannel('enableHudOutput')}>
                            <div class="channel-icon">${icons.shield(18)}</div>
                            <div class="channel-info">
                                <span class="channel-name">Stealth Answer HUD</span>
                                <span class="channel-desc">Screen-share excluded window</span>
                            </div>
                            <div class="m3-switch ${this.enableHudOutput ? 'active' : ''}"></div>
                        </div>

                        <div class="channel-card ${this.enableScreenPulse ? 'active' : ''}" @click=${() => this.toggleChannel('enableScreenPulse')}>
                            <div class="channel-icon">${icons.lightbulb(18)}</div>
                            <div class="channel-info">
                                <span class="channel-name">Screen Edge Pulse</span>
                                <span class="channel-desc">Flashes edge N times (1=A, 2=B, 3=C ... 26=Z)</span>
                            </div>
                            <div class="m3-switch ${this.enableScreenPulse ? 'active' : ''}"></div>
                        </div>

                        <div class="channel-card ${this.enableAudioBeeps ? 'active' : ''}" @click=${() => this.toggleChannel('enableAudioBeeps')}>
                            <div class="channel-icon">${icons.headphones(18)}</div>
                            <div class="channel-info">
                                <span class="channel-name">Earbud Audio Blips</span>
                                <span class="channel-desc">Soft sine beeps sent directly to headphone</span>
                            </div>
                            <div class="m3-switch ${this.enableAudioBeeps ? 'active' : ''}"></div>
                        </div>
                    </div>
                </div>

                <!-- Solved Result Card -->
                <div class="m3-result-card">
                    <div class="result-header">
                        <div class="result-title-group">
                            ${
                                this.lastResult
                                    ? html`
                                          ${
                                              this.lastResult.letter
                                                  ? html`<div class="m3-letter-badge">${this.lastResult.letter}</div>`
                                                  : html`<div class="m3-letter-badge none">TEXT</div>`
                                          }
                                          <div class="result-meta">
                                              <span class="result-type-tag">
                                                  ${this.lastResult.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'} ·
                                                  ${this.lastResult.confidence || 95}% Confidence
                                              </span>
                                              <span class="result-timestamp">
                                                  ${new Date(this.lastResult.timestamp || Date.now()).toLocaleTimeString()}
                                              </span>
                                          </div>
                                      `
                                    : html`
                                          <div class="result-meta">
                                              <span class="result-type-tag" style="color: #9ca3af;">Solver Result</span>
                                              <span class="result-timestamp">No question solved yet</span>
                                          </div>
                                      `
                            }
                        </div>
                        ${
                            this.lastResult
                                ? html`
                                      <div style="display:flex;gap:8px;">
                                          <button class="btn-tonal" @click=${() => this.copyAnswer()} title="Copy answer">Copy</button>
                                          <button class="btn-tonal" @click=${() => this.clearResult()} title="Clear answer">Clear</button>
                                      </div>
                                  `
                                : ''
                        }
                    </div>

                    <div class="result-body">
                        ${
                            this.lastResult
                                ? html`
                                      <div class="answer-container">
                                          <div class="answer-label">Correct Solution</div>
                                          <div class="answer-text">${this.lastResult.answer}</div>
                                      </div>
                                      ${
                                          this.lastResult.explanation
                                              ? html`
                                                    <div class="explanation-container">
                                                        <div class="explanation-label">Reasoning & Justification</div>
                                                        <div class="explanation-text">${this.lastResult.explanation}</div>
                                                    </div>
                                                `
                                              : ''
                                      }
                                  `
                                : html`
                                      <div class="empty-state">
                                          <div class="radar-box">${icons.target(28)}</div>
                                          <span class="empty-state-title">Awaiting Question</span>
                                          <span class="empty-state-desc">
                                              Position your cursor near any question and press
                                              <span class="kbd-inline">${this.solveKeybind}</span>.
                                          </span>
                                      </div>
                                  `
                        }
                    </div>
                </div>

                <!-- M3 BYOK Footer Pill -->
                <div class="byok-banner">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="byok-pill">BYOK</span>
                        <span>100% Free & Open-Source. Direct API access without subscription fees.</span>
                    </div>
                    <span class="byok-link" @click=${() => this.navigateToSettings()}> Configure Keys in Settings ${icons.arrowUpRight(11)} </span>
                </div>
            </div>
        `;
    }
}

customElements.define('exam-solver-view', ExamSolverView);
