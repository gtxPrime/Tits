import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';
import { icons } from '../../utils/icons.js';

export class CustomizeView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                background: #0d0e13;
                color: #f3f4f6;
                scrollbar-gutter: stable;
            }

            :host::-webkit-scrollbar {
                width: 8px;
            }
            :host::-webkit-scrollbar-track {
                background: transparent;
            }
            :host::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 999px;
            }
            :host::-webkit-scrollbar-thumb:hover {
                background: rgba(250, 204, 21, 0.4);
            }

            .m3-container {
                width: 100%;
                max-width: 960px;
                margin: 0 auto;
                padding: 28px 28px 60px 28px;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .m3-surface {
                background: #171821;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 22px;
                padding: 24px 26px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.35);
                transition: border-color 0.2s ease;
            }

            .m3-surface:hover {
                border-color: rgba(250, 204, 21, 0.18);
            }

            .surface-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
            }

            .surface-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 15px;
                font-weight: 700;
                color: #f9fafb;
                letter-spacing: -0.01em;
            }

            .surface-icon {
                color: #facc15;
                display: flex;
                align-items: center;
            }

            .surface-subtitle {
                font-size: 12px;
                color: #9ca3af;
                line-height: 1.5;
            }

            .badge-gold {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 700;
                color: #facc15;
                padding: 4px 12px;
                border-radius: 999px;
                background: rgba(250, 204, 21, 0.1);
                border: 1px solid rgba(250, 204, 21, 0.25);
            }

            .byok-grid {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .key-card {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 18px 20px;
                border-radius: 18px;
                background: #1d1e28;
                border: 1px solid rgba(255, 255, 255, 0.05);
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .key-card:hover {
                border-color: rgba(250, 204, 21, 0.25);
            }

            .key-card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
            }

            .key-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 700;
                font-size: 13px;
                color: #f9fafb;
            }

            .key-link {
                font-size: 11px;
                font-weight: 600;
                color: #facc15;
                text-decoration: none;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                border-radius: 999px;
                background: rgba(250, 204, 21, 0.08);
                border: 1px solid rgba(250, 204, 21, 0.2);
                transition: all 0.15s ease;
            }

            .key-link:hover {
                background: rgba(250, 204, 21, 0.2);
                color: #ffffff;
            }

            .key-input-row {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .key-input {
                flex: 1;
                font-family: var(--font-mono);
                font-size: 13px;
                letter-spacing: 0.5px;
                background: #14151c;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 10px 14px;
                color: #f3f4f6;
            }

            .key-input:focus {
                outline: none;
                border-color: #facc15;
                box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.2);
            }

            .icon-btn {
                background: #14151c;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 10px 12px;
                cursor: pointer;
                color: #9ca3af;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
            }

            .icon-btn:hover {
                background: rgba(250, 204, 21, 0.15);
                color: #facc15;
                border-color: rgba(250, 204, 21, 0.3);
            }

            .action-btn-primary {
                background: #facc15;
                color: #1a1500;
                font-weight: 800;
                font-size: 12px;
                border: none;
                border-radius: 999px;
                padding: 10px 20px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 2px 10px rgba(250, 204, 21, 0.25);
            }

            .action-btn-primary:hover {
                background: #fde047;
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(250, 204, 21, 0.4);
            }

            .action-btn-secondary {
                background: #242531;
                color: #f3f4f6;
                font-weight: 600;
                font-size: 12px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 999px;
                padding: 8px 16px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.15s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .action-btn-secondary:hover {
                background: rgba(250, 204, 21, 0.12);
                border-color: rgba(250, 204, 21, 0.3);
                color: #facc15;
            }

            .key-hint {
                font-size: 11px;
                color: #9ca3af;
                line-height: 1.4;
            }

            .key-status {
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .key-status.success {
                background: rgba(16, 185, 129, 0.12);
                color: #34d399;
                border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .key-status.error {
                background: rgba(239, 68, 68, 0.12);
                color: #f87171;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .mode-card-btn {
                padding: 18px 20px;
                border-radius: 18px;
                cursor: pointer;
                text-align: left;
                display: flex;
                flex-direction: column;
                gap: 6px;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                border: 1px solid rgba(255, 255, 255, 0.06);
                background: #1d1e28;
            }

            .mode-card-btn.active-test {
                border-color: rgba(250, 204, 21, 0.4);
                background: #23231e;
                box-shadow: 0 2px 14px rgba(0, 0, 0, 0.2);
            }

            .mode-card-btn.active-interview {
                border-color: rgba(192, 132, 252, 0.4);
                background: #221e28;
                box-shadow: 0 2px 14px rgba(0, 0, 0, 0.2);
            }

            .mode-card-btn:hover {
                transform: translateY(-2px);
            }

            .mode-card-title {
                font-size: 14px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .mode-card-desc {
                font-size: 11px;
                color: #9ca3af;
                line-height: 1.4;
            }

            .toggle-row {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 16px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 16px;
                background: #1d1e28;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .toggle-row:hover {
                border-color: rgba(250, 204, 21, 0.25);
                background: #21222e;
            }

            .toggle-icon {
                color: #facc15;
                display: flex;
                align-items: center;
            }

            .toggle-label {
                color: #f3f4f6;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                flex: 1;
            }

            .m3-switch {
                width: 36px;
                height: 20px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.12);
                position: relative;
                cursor: pointer;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .m3-switch.active {
                background: #facc15;
            }

            .m3-switch::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #ffffff;
                transition: transform 0.2s ease;
            }

            .m3-switch.active::after {
                transform: translateX(16px);
                background: #1a1500;
            }

            .slider-wrap {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }

            .slider-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-sm);
            }

            .slider-value {
                font-family: var(--font-mono);
                font-size: 12px;
                font-weight: 600;
                color: #facc15;
                background: rgba(250, 204, 21, 0.1);
                border: 1px solid rgba(250, 204, 21, 0.25);
                border-radius: 999px;
                padding: 2px 10px;
            }

            .slider-input {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.12);
                outline: none;
                cursor: pointer;
            }

            .slider-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #facc15;
                border: 2px solid #1a1500;
                box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
                cursor: pointer;
                transition: transform 0.15s ease;
            }

            .slider-input::-webkit-slider-thumb:hover {
                transform: scale(1.15);
            }

            .slider-input::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #facc15;
                border: 2px solid #1a1500;
                box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
                cursor: pointer;
            }

            .keybind-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }

            .keybind-row:last-of-type {
                border-bottom: none;
            }

            .keybind-name {
                color: #d1d5db;
                font-size: 13px;
                font-weight: 500;
            }

            .keybind-input {
                width: 140px;
                text-align: center;
                font-family: var(--font-mono);
                font-size: 12px;
                font-weight: 600;
                color: #facc15;
                background: #14151c;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 6px 10px;
            }

            .keybind-input:focus {
                border-color: #facc15;
                box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.25);
            }

            .danger-surface {
                border-color: rgba(239, 68, 68, 0.2);
            }

            .danger-button {
                border: 1px solid rgba(239, 68, 68, 0.35);
                color: #f87171;
                background: rgba(239, 68, 68, 0.08);
                border-radius: 999px;
                padding: 10px 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .danger-button:hover {
                background: rgba(239, 68, 68, 0.18);
                border-color: #ef4444;
            }

            .danger-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .path-code {
                font-family: var(--font-mono);
                font-size: 11px;
                background: rgba(0, 0, 0, 0.3);
                padding: 2px 6px;
                border-radius: 6px;
                color: #facc15;
            }

            /* Model Usage and Comparison Styles */
            .model-usage-card {
                background: #14151e;
                border: 1px solid rgba(250, 204, 21, 0.2);
                border-radius: 18px;
                padding: 18px 20px;
                display: flex;
                flex-direction: column;
                gap: 14px;
                margin-top: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            }

            .usage-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
            }

            .usage-model-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 700;
                font-size: 14px;
                color: #ffffff;
            }

            .usage-badge {
                font-size: 11px;
                font-weight: 700;
                padding: 3px 10px;
                border-radius: 999px;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                background: rgba(250, 204, 21, 0.15);
                color: #facc15;
                border: 1px solid rgba(250, 204, 21, 0.35);
            }

            .usage-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                gap: 10px;
            }

            .stat-box {
                background: #1b1c26;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 10px 14px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .stat-label {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #9ca3af;
                font-weight: 600;
            }

            .stat-value {
                font-size: 15px;
                font-weight: 800;
                color: #f9fafb;
                display: flex;
                align-items: baseline;
                gap: 4px;
            }

            .stat-value.healthy {
                color: #10b981;
            }

            .stat-value.warning {
                color: #f59e0b;
            }

            .stat-value.depleted {
                color: #ef4444;
            }

            .progress-track {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 999px;
                overflow: hidden;
                position: relative;
            }

            .progress-fill {
                height: 100%;
                border-radius: 999px;
                transition: width 0.3s ease;
            }

            .progress-fill.healthy {
                background: linear-gradient(90deg, #10b981, #34d399);
            }

            .progress-fill.warning {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
            }

            .progress-fill.depleted {
                background: linear-gradient(90deg, #ef4444, #f87171);
            }

            .model-intel-row {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding-top: 10px;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
                font-size: 12px;
                color: #d1d5db;
                line-height: 1.5;
            }

            .intel-highlight {
                color: #facc15;
                font-weight: 600;
            }

            .ratings-row {
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
                font-size: 11px;
                color: #9ca3af;
            }

            .rating-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 255, 255, 0.04);
                padding: 4px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.06);
            }

            .comparison-toggle-btn {
                background: transparent;
                border: 1px dashed rgba(250, 204, 21, 0.35);
                color: #facc15;
                border-radius: 12px;
                padding: 8px 16px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: 6px;
                width: fit-content;
                transition: all 0.15s ease;
            }

            .comparison-toggle-btn:hover {
                background: rgba(250, 204, 21, 0.08);
                border-color: #facc15;
            }

            .matrix-wrap {
                margin-top: 8px;
                overflow-x: auto;
                background: #171822;
                border-radius: 14px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                padding: 8px;
            }

            .matrix-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                min-width: 650px;
            }

            .matrix-table th {
                text-align: left;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.03);
                color: #9ca3af;
                font-weight: 600;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .matrix-table td {
                padding: 8px 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                vertical-align: middle;
            }

            .matrix-table tr.active-model-row {
                background: rgba(250, 204, 21, 0.07);
            }

            .matrix-select-btn {
                background: #252636;
                color: #f3f4f6;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 4px 10px;
                font-size: 10px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .matrix-select-btn:hover {
                background: #facc15;
                color: #171821;
            }

            .matrix-select-btn.current {
                background: rgba(250, 204, 21, 0.2);
                border-color: #facc15;
                color: #facc15;
                cursor: default;
            }
        `,
    ];

    static properties = {
        apiKey: { type: String },
        groqApiKey: { type: String },
        showApiKey: { type: Boolean },
        showGroqKey: { type: Boolean },
        keySaveStatus: { type: String },
        keySaveSuccess: { type: Boolean },
        appMode: { type: String },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        selectedImageQuality: { type: String },
        layoutMode: { type: String },
        keybinds: { type: Object },
        googleSearchEnabled: { type: Boolean },
        backgroundTransparency: { type: Number },
        fontSize: { type: Number },
        theme: { type: String },
        cursorCropWidth: { type: Number },
        cursorCropHeight: { type: Number },
        contentProtection: { type: Boolean },
        beepVolume: { type: Number },
        beepPitch: { type: Number },
        screenPulseColor: { type: String },
        screenPulseDuration: { type: Number },
        examVisionModel: { type: String },
        examTriggerMode: { type: String },
        examCaptureRegion: { type: String },
        clickHoldDuration: { type: Number },
        enableTrayOutput: { type: Boolean },
        transparentIdleTray: { type: Boolean },
        enableHudOutput: { type: Boolean },
        enableScreenPulse: { type: Boolean },
        enableAudioBeeps: { type: Boolean },
        enableCapsLockIndicator: { type: Boolean },
        capsLockMode: { type: String },
        autoScrollEnabled: { type: Boolean },
        modelUsages: { type: Object },
        activeModelUsage: { type: Object },
        showModelComparison: { type: Boolean },
        isTestingCapsLock: { type: Boolean },
        isTestingTray: { type: Boolean },
        isTestingPulse: { type: Boolean },
        isTestingAudio: { type: Boolean },
        onProfileChange: { type: Function },
        onLanguageChange: { type: Function },
        onImageQualityChange: { type: Function },
        onLayoutModeChange: { type: Function },
        isClearing: { type: Boolean },
        isRestoring: { type: Boolean },
        clearStatusMessage: { type: String },
        clearStatusType: { type: String },
    };

    constructor() {
        super();
        this.apiKey = '';
        this.groqApiKey = '';
        this.showApiKey = false;
        this.showGroqKey = false;
        this.keySaveStatus = '';
        this.keySaveSuccess = false;

        this.appMode = 'test';
        this.selectedProfile = 'interview';
        this.selectedLanguage = 'en-US';
        this.selectedImageQuality = 'medium';
        this.layoutMode = 'normal';
        this.keybinds = this.getDefaultKeybinds();
        this.onProfileChange = () => {};
        this.onLanguageChange = () => {};
        this.onImageQualityChange = () => {};
        this.onLayoutModeChange = () => {};

        this.googleSearchEnabled = true;
        this.isClearing = false;
        this.isRestoring = false;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.backgroundTransparency = 0.8;
        this.fontSize = 20;
        this.audioMode = 'speaker_only';
        this.customPrompt = '';
        this.theme = 'dark';

        this.examTriggerMode = 'hotkey';
        this.examCaptureRegion = 'cursor_crop';
        this.clickHoldDuration = 5;
        this.cursorCropWidth = 850;
        this.cursorCropHeight = 600;
        this.enableTrayOutput = true;
        this.transparentIdleTray = false;
        this.enableHudOutput = true;
        this.enableScreenPulse = true;
        this.enableAudioBeeps = true;
        this.enableCapsLockIndicator = false;
        this.capsLockMode = 'pulse';
        this.contentProtection = true;
        this.beepVolume = 0.2;
        this.beepPitch = 880;
        this.screenPulseColor = '#facc15';
        this.screenPulseDuration = 800;
        this.examVisionModel = 'gemini-flash-latest';
        this.autoScrollEnabled = true;
        this.modelUsages = {};
        this.activeModelUsage = null;
        this.showModelComparison = false;
        this.isTestingCapsLock = false;
        this.isTestingTray = false;
        this.isTestingPulse = false;
        this.isTestingAudio = false;

        this._loadFromStorage();
    }

    getThemes() {
        if (window.tits && window.tits.theme && window.tits.theme.getAll) {
            return window.tits.theme.getAll();
        }
        return [
            { value: 'dark', name: 'Cyber Dark (Gold Accent)' },
            { value: 'light', name: 'Light' },
        ];
    }

    async _loadFromStorage() {
        try {
            const [prefs, keybinds, creds] = await Promise.all([
                tits.storage.getPreferences().catch(() => ({})),
                tits.storage.getKeybinds().catch(() => null),
                tits.storage.getCredentials().catch(() => ({})),
            ]);

            this.apiKey = creds.apiKey || '';
            this.groqApiKey = creds.groqApiKey || '';
            this.appMode = prefs.appMode || 'test';
            this.examTriggerMode = prefs.examTriggerMode || 'hotkey';
            this.examCaptureRegion = prefs.examCaptureRegion || 'cursor_crop';
            this.clickHoldDuration = prefs.clickHoldDuration || 5;
            this.cursorCropWidth = prefs.cursorCropWidth || 850;
            this.cursorCropHeight = prefs.cursorCropHeight || 600;
            this.enableTrayOutput = prefs.enableTrayOutput !== false;
            this.transparentIdleTray = prefs.transparentIdleTray === true;
            this.enableHudOutput = prefs.enableHudOutput !== false;
            this.enableScreenPulse = prefs.enableScreenPulse !== false;
            this.enableAudioBeeps = prefs.enableAudioBeeps !== false;
            this.enableCapsLockIndicator = prefs.enableCapsLockIndicator === true;
            this.capsLockMode = prefs.capsLockMode || 'pulse';
            this.contentProtection = prefs.contentProtection !== false;
            this.beepVolume = prefs.beepVolume ?? 0.2;
            this.beepPitch = prefs.beepPitch ?? 880;
            this.screenPulseColor = prefs.screenPulseColor || '#facc15';
            this.screenPulseDuration = prefs.screenPulseDuration || 800;
            this.examVisionModel = prefs.examVisionModel || 'gemini-flash-latest';
            this.autoScrollEnabled = prefs.autoScrollEnabled !== false;

            if (window.tits && window.tits.storage && window.tits.storage.getModelUsage) {
                try {
                    this.activeModelUsage = await window.tits.storage.getModelUsage(this.examVisionModel);
                    this.modelUsages = (await window.tits.storage.getAllModelUsages()) || {};
                } catch (err) {
                    console.warn('Failed to load model usage stats:', err);
                }
            }

            this.googleSearchEnabled = prefs.googleSearchEnabled ?? true;
            this.backgroundTransparency = prefs.backgroundTransparency ?? 0.8;
            this.fontSize = prefs.fontSize ?? 20;
            this.audioMode = prefs.audioMode ?? 'speaker_only';
            this.customPrompt = prefs.customPrompt ?? '';
            this.theme = prefs.theme ?? 'dark';

            if (keybinds) {
                this.keybinds = { ...this.getDefaultKeybinds(), ...keybinds };
            }

            this.updateBackgroundAppearance();
            this.updateFontSize();
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    getDefaultKeybinds() {
        const isMac = (window.tits && window.tits.isMacOS) || navigator.platform.includes('Mac');
        return {
            solveExam: isMac ? 'Alt+Cmd+Q' : 'Ctrl+Alt+Q',
            moveUp: isMac ? 'Alt+Up' : 'Ctrl+Up',
            moveDown: isMac ? 'Alt+Down' : 'Ctrl+Down',
            moveLeft: isMac ? 'Alt+Left' : 'Ctrl+Left',
            moveRight: isMac ? 'Alt+Right' : 'Ctrl+Right',
            toggleVisibility: isMac ? 'Cmd+\\' : 'Ctrl+\\',
            toggleClickThrough: isMac ? 'Cmd+M' : 'Ctrl+M',
            nextStep: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
            previousResponse: isMac ? 'Cmd+[' : 'Ctrl+[',
            nextResponse: isMac ? 'Cmd+]' : 'Ctrl+]',
            scrollUp: isMac ? 'Cmd+Shift+Up' : 'Ctrl+Shift+Up',
            scrollDown: isMac ? 'Cmd+Shift+Down' : 'Ctrl+Shift+Down',
        };
    }

    getKeybindActions() {
        return [
            { key: 'solveExam', name: 'Solve Exam Question', description: 'Target question near cursor and solve instantly' },
            { key: 'moveUp', name: 'Move Window Up', description: 'Move the app window up' },
            { key: 'moveDown', name: 'Move Window Down', description: 'Move the app window down' },
            { key: 'moveLeft', name: 'Move Window Left', description: 'Move the app window left' },
            { key: 'moveRight', name: 'Move Window Right', description: 'Move the app window right' },
            { key: 'toggleVisibility', name: 'Toggle Visibility', description: 'Show or hide the app window' },
            { key: 'toggleClickThrough', name: 'Toggle Click-through', description: 'Enable or disable click-through mode' },
            { key: 'nextStep', name: 'Ask Next Step', description: 'Take screenshot and ask for next step' },
            { key: 'previousResponse', name: 'Previous Response', description: 'Move to previous AI response' },
            { key: 'nextResponse', name: 'Next Response', description: 'Move to next AI response' },
            { key: 'scrollUp', name: 'Scroll Response Up', description: 'Scroll response content upward' },
            { key: 'scrollDown', name: 'Scroll Response Down', description: 'Scroll response content downward' },
        ];
    }

    async saveKeybinds() {
        await tits.storage.setKeybinds(this.keybinds);
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', this.keybinds);
        }
    }

    handleProfileSelect(e) {
        this.selectedProfile = e.target.value;
        this.onProfileChange(this.selectedProfile);
    }

    handleLanguageSelect(e) {
        this.selectedLanguage = e.target.value;
        this.onLanguageChange(this.selectedLanguage);
    }

    handleImageQualitySelect(e) {
        this.selectedImageQuality = e.target.value;
        this.onImageQualityChange(this.selectedImageQuality);
    }

    handleLayoutModeSelect(e) {
        this.layoutMode = e.target.value;
        this.onLayoutModeChange(this.layoutMode);
    }

    async handleCustomPromptInput(e) {
        this.customPrompt = e.target.value;
        await tits.storage.updatePreference('customPrompt', this.customPrompt);
    }

    async handleAudioModeSelect(e) {
        this.audioMode = e.target.value;
        await tits.storage.updatePreference('audioMode', this.audioMode);
        this.requestUpdate();
    }

    async handleThemeChange(e) {
        this.theme = e.target.value;
        if (tits.theme && tits.theme.save) {
            await tits.theme.save(this.theme);
        }
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    async handleGoogleSearchChange(e) {
        this.googleSearchEnabled = e.target.checked;
        await tits.storage.updatePreference('googleSearchEnabled', this.googleSearchEnabled);
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('update-google-search-setting', this.googleSearchEnabled);
            } catch (error) {
                console.error('Failed to notify main process:', error);
            }
        }
        this.requestUpdate();
    }

    async handleBackgroundTransparencyChange(e) {
        this.backgroundTransparency = parseFloat(e.target.value);
        await tits.storage.updatePreference('backgroundTransparency', this.backgroundTransparency);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    updateBackgroundAppearance() {
        if (tits.theme && tits.theme.get) {
            const colors = tits.theme.get(this.theme);
            if (colors) {
                tits.theme.applyBackgrounds(colors.background, this.backgroundTransparency);
            }
        }
    }

    async handleFontSizeChange(e) {
        this.fontSize = parseInt(e.target.value, 10);
        await tits.storage.updatePreference('fontSize', this.fontSize);
        this.updateFontSize();
        this.requestUpdate();
    }

    updateFontSize() {
        document.documentElement.style.setProperty('--response-font-size', `${this.fontSize}px`);
    }

    handleKeybindChange(action, value) {
        this.keybinds = { ...this.keybinds, [action]: value };
        this.saveKeybinds();
        this.requestUpdate();
    }

    handleKeybindFocus(e) {
        e.target.placeholder = 'Press keys...';
        e.target.select();
    }

    handleKeybindInput(e) {
        e.preventDefault();
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.metaKey) modifiers.push('Cmd');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        let mainKey = e.key;

        switch (e.code) {
            case 'ArrowUp':
                mainKey = 'Up';
                break;
            case 'ArrowDown':
                mainKey = 'Down';
                break;
            case 'ArrowLeft':
                mainKey = 'Left';
                break;
            case 'ArrowRight':
                mainKey = 'Right';
                break;
            case 'Enter':
                mainKey = 'Enter';
                break;
            case 'Space':
                mainKey = 'Space';
                break;
            case 'Backslash':
                mainKey = '\\';
                break;
            default:
                if (e.key.length === 1) mainKey = e.key.toUpperCase();
                break;
        }

        if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

        const action = e.target.dataset.action;
        const keybind = [...modifiers, mainKey].join('+');
        this.handleKeybindChange(action, keybind);
        e.target.value = keybind;
        e.target.blur();
    }

    async resetKeybinds() {
        this.keybinds = this.getDefaultKeybinds();
        await tits.storage.setKeybinds(null);
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('update-keybinds', this.keybinds);
        }
        this.requestUpdate();
    }

    async restoreAllSettings() {
        if (this.isRestoring) return;
        this.isRestoring = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();
        try {
            const defaults = {
                customPrompt: '',
                selectedProfile: 'interview',
                selectedLanguage: 'en-US',
                selectedScreenshotInterval: '5',
                selectedImageQuality: 'medium',
                audioMode: 'speaker_only',
                fontSize: 20,
                backgroundTransparency: 0.8,
                googleSearchEnabled: false,
                theme: 'dark',
                appMode: 'test',
                examTriggerMode: 'hotkey',
                examCaptureRegion: 'cursor_crop',
                cursorCropWidth: 850,
                cursorCropHeight: 600,
                enableTrayOutput: true,
                enableHudOutput: true,
                enableScreenPulse: true,
                enableAudioBeeps: true,
                contentProtection: true,
                screenPulseColor: '#facc15',
            };
            for (const [key, value] of Object.entries(defaults)) {
                await tits.storage.updatePreference(key, value);
            }

            this.keybinds = this.getDefaultKeybinds();
            await tits.storage.setKeybinds(null);
            if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('update-keybinds', this.keybinds);
            }

            this.selectedProfile = defaults.selectedProfile;
            this.selectedLanguage = defaults.selectedLanguage;
            this.selectedImageQuality = defaults.selectedImageQuality;
            this.audioMode = defaults.audioMode;
            this.fontSize = defaults.fontSize;
            this.backgroundTransparency = defaults.backgroundTransparency;
            this.googleSearchEnabled = defaults.googleSearchEnabled;
            this.theme = defaults.theme;
            this.appMode = defaults.appMode;

            this.onProfileChange(defaults.selectedProfile);
            this.onLanguageChange(defaults.selectedLanguage);
            this.onImageQualityChange(defaults.selectedImageQuality);

            this.updateBackgroundAppearance();
            this.updateFontSize();

            this.clearStatusMessage = 'All settings restored to defaults';
            this.clearStatusType = 'success';
        } catch (error) {
            console.error('Error restoring settings:', error);
            this.clearStatusMessage = `Error restoring settings: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isRestoring = false;
            this.requestUpdate();
        }
    }

    async clearLocalData() {
        if (this.isClearing) return;
        this.isClearing = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();
        try {
            await tits.storage.clearAll();
            this.clearStatusMessage = 'Successfully cleared all local data';
            this.clearStatusType = 'success';
            this.requestUpdate();
            setTimeout(() => {
                this.clearStatusMessage = 'Closing application...';
                this.requestUpdate();
                setTimeout(async () => {
                    if (window.require) {
                        const { ipcRenderer } = window.require('electron');
                        await ipcRenderer.invoke('quit-application');
                    }
                }, 1000);
            }, 2000);
        } catch (error) {
            console.error('Error clearing data:', error);
            this.clearStatusMessage = `Error clearing data: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isClearing = false;
            this.requestUpdate();
        }
    }

    getProfiles() {
        return [
            { value: 'exam', name: 'Exam Assistant (Instant MCQ Solver)' },
            { value: 'interview', name: 'Job Interview (Real-time Copilot)' },
            { value: 'sales', name: 'Sales Call' },
            { value: 'meeting', name: 'Business Meeting' },
            { value: 'presentation', name: 'Presentation' },
            { value: 'negotiation', name: 'Negotiation' },
        ];
    }

    getLanguages() {
        return [
            { value: 'en-US', name: 'English (US)' },
            { value: 'en-GB', name: 'English (UK)' },
            { value: 'en-AU', name: 'English (Australia)' },
            { value: 'en-IN', name: 'English (India)' },
            { value: 'de-DE', name: 'German (Germany)' },
            { value: 'es-US', name: 'Spanish (US)' },
            { value: 'es-ES', name: 'Spanish (Spain)' },
            { value: 'fr-FR', name: 'French (France)' },
            { value: 'fr-CA', name: 'French (Canada)' },
            { value: 'hi-IN', name: 'Hindi (India)' },
            { value: 'pt-BR', name: 'Portuguese (Brazil)' },
            { value: 'ar-XA', name: 'Arabic (Generic)' },
            { value: 'id-ID', name: 'Indonesian (Indonesia)' },
            { value: 'it-IT', name: 'Italian (Italy)' },
            { value: 'ja-JP', name: 'Japanese (Japan)' },
            { value: 'tr-TR', name: 'Turkish (Turkey)' },
            { value: 'vi-VN', name: 'Vietnamese (Vietnam)' },
            { value: 'bn-IN', name: 'Bengali (India)' },
            { value: 'gu-IN', name: 'Gujarati (India)' },
            { value: 'kn-IN', name: 'Kannada (India)' },
            { value: 'ml-IN', name: 'Malayalam (India)' },
            { value: 'mr-IN', name: 'Marathi (India)' },
            { value: 'ta-IN', name: 'Tamil (India)' },
            { value: 'te-IN', name: 'Telugu (India)' },
            { value: 'nl-NL', name: 'Dutch (Netherlands)' },
            { value: 'ko-KR', name: 'Korean (South Korea)' },
            { value: 'cmn-CN', name: 'Mandarin Chinese (China)' },
            { value: 'pl-PL', name: 'Polish (Poland)' },
            { value: 'ru-RU', name: 'Russian (Russia)' },
            { value: 'th-TH', name: 'Thai (Thailand)' },
        ];
    }

    async handleSaveGeminiKey() {
        try {
            await tits.storage.setApiKey(this.apiKey);
            this.keySaveStatus = 'Gemini API key saved securely!';
            this.keySaveSuccess = true;
            this.requestUpdate();
            setTimeout(() => {
                if (this.keySaveSuccess) {
                    this.keySaveStatus = '';
                    this.requestUpdate();
                }
            }, 3500);
        } catch (err) {
            this.keySaveStatus = `Failed to save Gemini key: ${err.message}`;
            this.keySaveSuccess = false;
            this.requestUpdate();
        }
    }

    async handleSaveGroqKey() {
        try {
            await tits.storage.setGroqApiKey(this.groqApiKey);
            this.keySaveStatus = 'Groq API key saved securely!';
            this.keySaveSuccess = true;
            this.requestUpdate();
            setTimeout(() => {
                if (this.keySaveSuccess) {
                    this.keySaveStatus = '';
                    this.requestUpdate();
                }
            }, 3500);
        } catch (err) {
            this.keySaveStatus = `Failed to save Groq key: ${err.message}`;
            this.keySaveSuccess = false;
            this.requestUpdate();
        }
    }

    handleExternalLink(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (window.require) {
            try {
                const { shell } = window.require('electron');
                shell.openExternal(href);
            } catch {
                window.open(href, '_blank');
            }
        } else {
            window.open(href, '_blank');
        }
    }

    async handleAppModeChange(mode) {
        this.appMode = mode;
        await tits.storage.updatePreference('appMode', mode);
        this.requestUpdate();
    }

    async handleExamPrefToggle(prefKey) {
        this[prefKey] = !this[prefKey];
        await tits.storage.updatePreference(prefKey, this[prefKey]);
        if (prefKey === 'transparentIdleTray' && tits.refreshTrayIcon) {
            await tits.refreshTrayIcon();
        }
        this.requestUpdate();
    }

    async handleExamTriggerModeChange(e) {
        this.examTriggerMode = e.target.value;
        await tits.storage.updatePreference('examTriggerMode', this.examTriggerMode);
        if (tits.updateMouseTrigger) {
            const enabled = this.examTriggerMode === 'click_hold' || this.examTriggerMode === 'both';
            await tits.updateMouseTrigger(enabled, this.clickHoldDuration);
        }
        this.requestUpdate();
    }

    async handleClickHoldDurationChange(e) {
        this.clickHoldDuration = parseInt(e.target.value, 10) || 5;
        await tits.storage.updatePreference('clickHoldDuration', this.clickHoldDuration);
        if (tits.updateMouseTrigger && (this.examTriggerMode === 'click_hold' || this.examTriggerMode === 'both')) {
            await tits.updateMouseTrigger(true, this.clickHoldDuration);
        }
        this.requestUpdate();
    }

    async handleExamCaptureRegionChange(e) {
        this.examCaptureRegion = e.target.value;
        await tits.storage.updatePreference('examCaptureRegion', this.examCaptureRegion);
        this.requestUpdate();
    }

    async handleCropWidthChange(e) {
        this.cursorCropWidth = parseInt(e.target.value, 10) || 850;
        await tits.storage.updatePreference('cursorCropWidth', this.cursorCropWidth);
        this.requestUpdate();
    }

    async handleCropHeightChange(e) {
        this.cursorCropHeight = parseInt(e.target.value, 10) || 600;
        await tits.storage.updatePreference('cursorCropHeight', this.cursorCropHeight);
        this.requestUpdate();
    }

    async handleBeepVolumeChange(e) {
        this.beepVolume = parseFloat(e.target.value) || 0.2;
        await tits.storage.updatePreference('beepVolume', this.beepVolume);
        this.requestUpdate();
    }

    async handleBeepPitchChange(e) {
        this.beepPitch = parseInt(e.target.value, 10) || 880;
        await tits.storage.updatePreference('beepPitch', this.beepPitch);
        this.requestUpdate();
    }

    async handleScreenPulseColorChange(e) {
        this.screenPulseColor = e.target.value;
        await tits.storage.updatePreference('screenPulseColor', this.screenPulseColor);
        this.requestUpdate();
    }

    async handleExamVisionModelChange(e) {
        this.examVisionModel = e.target.value;
        await tits.storage.updatePreference('examVisionModel', this.examVisionModel);
        if (window.tits && window.tits.storage && window.tits.storage.getModelUsage) {
            this.activeModelUsage = await window.tits.storage.getModelUsage(this.examVisionModel);
            this.modelUsages = (await window.tits.storage.getAllModelUsages()) || {};
        }
        this.requestUpdate();
    }

    async selectModel(modelId) {
        this.examVisionModel = modelId;
        await tits.storage.updatePreference('examVisionModel', modelId);
        if (window.tits && window.tits.storage && window.tits.storage.getModelUsage) {
            this.activeModelUsage = await window.tits.storage.getModelUsage(modelId);
            this.modelUsages = (await window.tits.storage.getAllModelUsages()) || {};
        }
        this.requestUpdate();
    }

    toggleModelComparison() {
        this.showModelComparison = !this.showModelComparison;
        this.requestUpdate();
    }

    async handleContentProtectionToggle() {
        this.contentProtection = !this.contentProtection;
        await tits.storage.updatePreference('contentProtection', this.contentProtection);
        if (window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                await ipcRenderer.invoke('set-content-protection', this.contentProtection);
            } catch (err) {
                console.warn('Could not set content protection:', err.message);
            }
        }
        this.requestUpdate();
    }

    async handleAutoScrollToggle() {
        this.autoScrollEnabled = !this.autoScrollEnabled;
        await tits.storage.updatePreference('autoScrollEnabled', this.autoScrollEnabled);
        this.requestUpdate();
    }

    async handleExamPrefToggle(prefKey) {
        this[prefKey] = !this[prefKey];
        await tits.storage.updatePreference(prefKey, this[prefKey]);
        this.requestUpdate();
    }

    testEarbudBeep() {
        if (this.isTestingAudio) return;
        this.isTestingAudio = true;
        this.requestUpdate();
        if (window.tits && window.tits.playStealthBeeps) {
            window.tits.playStealthBeeps(3);
        }
        setTimeout(() => {
            this.isTestingAudio = false;
            this.requestUpdate();
        }, 1200);
    }

    testScreenPulse() {
        if (this.isTestingPulse) return;
        this.isTestingPulse = true;
        this.requestUpdate();
        if (window.tits && window.tits.triggerScreenPulse) {
            window.tits.triggerScreenPulse(2);
        }
        setTimeout(() => {
            this.isTestingPulse = false;
            this.requestUpdate();
        }, 1200);
    }

    async handleCapsLockModeChange(e) {
        this.capsLockMode = e.target.value;
        await tits.storage.updatePreference('capsLockMode', this.capsLockMode);
        this.requestUpdate();
    }

    async testCapsLock() {
        if (this.isTestingCapsLock) return;
        this.isTestingCapsLock = true;
        this.requestUpdate();
        try {
            if (window.tits && window.tits.triggerCapsLockPulse) {
                await window.tits.triggerCapsLockPulse(2);
            }
        } catch (err) {
            console.warn('Failed to pulse Caps Lock:', err);
        }
        setTimeout(() => {
            this.isTestingCapsLock = false;
            this.requestUpdate();
        }, 1400);
    }

    async testTrayBadge() {
        if (this.isTestingTray) return;
        this.isTestingTray = true;
        this.requestUpdate();
        try {
            if (window.tits && window.tits.setTrayAnswer) {
                await window.tits.setTrayAnswer('B', 'Test Answer Option B');
                setTimeout(async () => {
                    await window.tits.setTrayAnswer(null);
                    this.isTestingTray = false;
                    this.requestUpdate();
                }, 3000);
            }
        } catch (err) {
            console.warn('Failed to test tray:', err);
            this.isTestingTray = false;
            this.requestUpdate();
        }
    }

    renderModeSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.target(18)}</span>
                        <span>Primary Operating Mode</span>
                    </div>
                    <span class="badge-gold"> ${this.appMode === 'test' ? 'TEST MODE ACTIVE' : 'INTERVIEW MODE ACTIVE'} </span>
                </div>
                <div class="surface-subtitle">
                    Select your primary workflow. Test Mode focuses on instant, zero-footprint MCQ solving, while Interview Mode provides live
                    speech-to-text guidance.
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;">
                    <button
                        type="button"
                        class="mode-card-btn ${this.appMode === 'test' ? 'active-test' : ''}"
                        @click=${() => this.handleAppModeChange('test')}
                    >
                        <div class="mode-card-title" style="color: ${this.appMode === 'test' ? '#facc15' : '#f9fafb'};">
                            ${icons.zap(15)}
                            <span>Test Mode (Exam Solver)</span>
                        </div>
                        <div class="mode-card-desc">Cursor region capture, system tray badge output [A-Z], earbud blips, and screen edge pulse.</div>
                    </button>

                    <button
                        type="button"
                        class="mode-card-btn ${this.appMode === 'interview' ? 'active-interview' : ''}"
                        @click=${() => this.handleAppModeChange('interview')}
                    >
                        <div class="mode-card-title" style="color: ${this.appMode === 'interview' ? '#c084fc' : '#f9fafb'};">
                            ${icons.mic(15)}
                            <span>Interview Mode (Teleprompter)</span>
                        </div>
                        <div class="mode-card-desc">Continuous microphone & system audio transcription, AI guidance, and question prediction.</div>
                    </button>
                </div>
            </section>
        `;
    }

    renderBYOKSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.key(18)}</span>
                        <span>AI Model API Keys (Pure BYOK)</span>
                    </div>
                    <span class="badge-gold">100% Free · Zero Subscriptions</span>
                </div>
                <div class="surface-subtitle">
                    Bring Your Own Key (BYOK) gives you unlimited privacy and direct access without recurring fees. Your keys are stored encrypted
                    locally in <span class="path-code">tits-config/credentials.json</span>.
                </div>

                <div class="byok-grid">
                    <!-- Google Gemini Key -->
                    <div class="key-card">
                        <div class="key-card-header">
                            <div class="key-title">
                                <span style="color:#facc15;">${icons.sparkles(16)}</span>
                                <span>Google Gemini API Key</span>
                                <span class="badge-gold" style="font-size:10px;padding:2px 8px;">Recommended</span>
                            </div>
                            <a class="key-link" href="https://aistudio.google.com/app/apikey" target="_blank" @click=${this.handleExternalLink}>
                                <span>Google AI Studio</span>
                                ${icons.arrowUpRight(11)}
                            </a>
                        </div>
                        <div class="key-input-row">
                            <input
                                type="${this.showApiKey ? 'text' : 'password'}"
                                class="key-input"
                                placeholder="Paste AIzaSy... key"
                                .value=${this.apiKey || ''}
                                @input=${e => {
                                    this.apiKey = e.target.value.trim();
                                }}
                                @change=${() => this.handleSaveGeminiKey()}
                                @blur=${() => this.handleSaveGeminiKey()}
                            />
                            <button
                                class="icon-btn"
                                @click=${() => {
                                    this.showApiKey = !this.showApiKey;
                                }}
                                title="${this.showApiKey ? 'Hide key' : 'Show key'}"
                            >
                                ${this.showApiKey ? icons.eyeOff(15) : icons.eye(15)}
                            </button>
                            <button class="action-btn-primary" @click=${this.handleSaveGeminiKey}>Save Key</button>
                        </div>
                        <div class="key-hint">
                            Powers sub-second vision, screen-solving, and conversational intelligence with generous free quotas.
                        </div>
                    </div>

                    <!-- Groq API Key -->
                    <div class="key-card">
                        <div class="key-card-header">
                            <div class="key-title">
                                <span style="color:#facc15;">${icons.zap(16)}</span>
                                <span>Groq API Key</span>
                                <span class="badge-gold" style="font-size:10px;padding:2px 8px;">High Speed</span>
                            </div>
                            <a class="key-link" href="https://console.groq.com/keys" target="_blank" @click=${this.handleExternalLink}>
                                <span>Groq Console</span>
                                ${icons.arrowUpRight(11)}
                            </a>
                        </div>
                        <div class="key-input-row">
                            <input
                                type="${this.showGroqKey ? 'text' : 'password'}"
                                class="key-input"
                                placeholder="Paste gsk_... key"
                                .value=${this.groqApiKey || ''}
                                @input=${e => {
                                    this.groqApiKey = e.target.value.trim();
                                }}
                                @change=${() => this.handleSaveGroqKey()}
                                @blur=${() => this.handleSaveGroqKey()}
                            />
                            <button
                                class="icon-btn"
                                @click=${() => {
                                    this.showGroqKey = !this.showGroqKey;
                                }}
                                title="${this.showGroqKey ? 'Hide key' : 'Show key'}"
                            >
                                ${this.showGroqKey ? icons.eyeOff(15) : icons.eye(15)}
                            </button>
                            <button class="action-btn-primary" @click=${this.handleSaveGroqKey}>Save Key</button>
                        </div>
                        <div class="key-hint">Powers ultra-low-latency Llama 3.2 Vision and Qwen models with sub-second generation.</div>
                    </div>
                </div>

                ${
                    this.keySaveStatus
                        ? html`
                              <div class="key-status ${this.keySaveSuccess ? 'success' : 'error'}">
                                  ${this.keySaveSuccess ? icons.check(14) : icons.alertTriangle(14)}
                                  <span>${this.keySaveStatus}</span>
                              </div>
                          `
                        : ''
                }
            </section>
        `;
    }

    renderActiveModelUsageCard() {
        const currentModel = this.examVisionModel || 'gemini-flash-latest';
        const usage = this.activeModelUsage || {
            model: currentModel,
            meta: {
                name: currentModel,
                provider: currentModel.startsWith('llama') ? 'Groq LPUs' : 'Google Gemini',
                dailyLimit: 250,
                speedLabel: 'Fast (~1.2s)',
                speedRating: 5,
                reasoningRating: 4,
                badge: 'Recommended',
                tagline: 'Best all-rounder: ultra-fast responses, high accuracy, and 250 RPD quota',
                comparison: 'Faster than Pro models, with 12x higher free quota than 2.5-flash (250 vs 20 RPD). Ideal for standard exams.',
            },
            usedToday: 0,
            dailyLimit: 250,
            remaining: 250,
            percentUsed: 0,
            percentRemaining: 100,
            status: 'good',
        };

        const meta = usage.meta || {};
        const isDepleted = usage.status === 'depleted';
        const isLow = usage.status === 'low';
        const statusClass = isDepleted ? 'depleted' : isLow ? 'warning' : 'healthy';

        const toggleIcon = this.showModelComparison
            ? icons.chevronUp
                ? icons.chevronUp(14)
                : html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>`
            : icons.chevronDown
              ? icons.chevronDown(14)
              : html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>`;

        return html`
            <div class="model-usage-card">
                <div class="usage-header">
                    <div class="usage-model-title">
                        <span style="color:#facc15;display:flex;">${icons.sparkles ? icons.sparkles(16) : ''}</span>
                        <span>${meta.name || usage.model}</span>
                        <span style="font-size:11px;color:#9ca3af;font-weight:400;">(${meta.provider})</span>
                    </div>
                    <span class="usage-badge">${meta.badge || 'Active Model'}</span>
                </div>

                <div class="usage-stats-grid">
                    <div class="stat-box">
                        <span class="stat-label">Used Today</span>
                        <span class="stat-value">
                            ${usage.usedToday}
                            <span style="font-size:11px;color:#9ca3af;font-weight:500;">/ ${usage.dailyLimit}</span>
                        </span>
                    </div>

                    <div class="stat-box">
                        <span class="stat-label">Left Today (Calculated)</span>
                        <span class="stat-value ${statusClass}">
                            ${usage.remaining}
                            <span style="font-size:11px;color:#9ca3af;font-weight:500;">left (${usage.percentRemaining}%)</span>
                        </span>
                    </div>

                    <div class="stat-box">
                        <span class="stat-label">Speed Rating</span>
                        <span class="stat-value" style="font-size:13px;color:#38bdf8;"> ${meta.speedLabel || 'Fast'} </span>
                    </div>

                    <div class="stat-box">
                        <span class="stat-label">Reasoning Quality</span>
                        <span class="stat-value" style="font-size:13px;color:#c084fc;">
                            ${'★'.repeat(Math.floor(meta.reasoningRating || 4))}
                            <span style="font-size:11px;color:#9ca3af;font-weight:500;">(${meta.reasoningRating || 4}/5)</span>
                        </span>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;">
                        <span>Daily Free Quota Usage</span>
                        <span>${usage.percentUsed}% used • ${usage.remaining} requests remaining</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${statusClass}" style="width: ${Math.max(4, usage.percentRemaining)}%"></div>
                    </div>
                </div>

                <div class="model-intel-row">
                    <div><span class="intel-highlight">Why Choose This Model:</span> ${meta.tagline}</div>
                    <div><span class="intel-highlight">Speed vs Accuracy Comparison:</span> ${meta.comparison}</div>
                </div>

                <button class="comparison-toggle-btn" @click=${this.toggleModelComparison}>
                    <span style="display:flex;">${toggleIcon}</span>
                    <span>${this.showModelComparison ? 'Hide Model Comparison Matrix' : 'Which Model is Faster / Better? Compare All Models'}</span>
                </button>

                ${this.showModelComparison ? this.renderModelComparisonMatrix() : ''}
            </div>
        `;
    }

    renderModelComparisonMatrix() {
        const modelsList = [
            {
                id: 'gemini-flash-latest',
                name: 'Gemini Flash (Latest)',
                provider: 'Google',
                speed: 'Ultra-Fast (~1.2s)',
                speedRank: '⚡⚡⚡⚡⚡',
                reasoning: 'High (4/5)',
                dailyQuota: '250 / day',
                bestFor: 'Best overall choice: high speed, great accuracy, generous quota',
                verdict: 'Recommended',
            },
            {
                id: 'gemini-3.5-flash',
                name: 'Gemini 3.5 Flash',
                provider: 'Google',
                speed: 'Very Fast (~1.4s)',
                speedRank: '⚡⚡⚡⚡⚡',
                reasoning: 'Enhanced (4.5/5)',
                dailyQuota: '250 / day',
                bestFor: 'Better question comprehension & blurry diagram OCR',
                verdict: 'Smarter & Fast',
            },
            {
                id: 'gemini-flash-lite-latest',
                name: 'Gemini Flash-Lite',
                provider: 'Google',
                speed: 'Blazing Fast (~0.9s)',
                speedRank: '⚡⚡⚡⚡⚡ (Fastest)',
                reasoning: 'Standard (3.5/5)',
                dailyQuota: '500 / day (Highest)',
                bestFor: 'Highest Google quota (500 RPD) & rapid-fire quiz solving',
                verdict: 'Fastest Gemini',
            },
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                provider: 'Google',
                speed: 'Fast (~1.5s)',
                speedRank: '⚡⚡⚡⚡',
                reasoning: 'Strong (4.5/5)',
                dailyQuota: '20 / day (Strict Free Limit)',
                bestFor: 'High precision STEM solving (requires paid API key for >20 req)',
                verdict: 'High Precision',
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                provider: 'Google',
                speed: 'Moderate (~3.5s)',
                speedRank: '⚡⚡⚡',
                reasoning: 'Elite (5/5)',
                dailyQuota: '20 / day (Strict Free Limit)',
                bestFor: 'Hard math, complex code debugging, and intricate proofs',
                verdict: 'Deep Logic',
            },
            {
                id: 'gemini-3.1-pro-preview',
                name: 'Gemini 3.1 Pro Preview',
                provider: 'Google',
                speed: 'Thorough (~4.5s)',
                speedRank: '⚡⚡',
                reasoning: 'Maximum (5/5)',
                dailyQuota: '20 / day (Strict Free Limit)',
                bestFor: 'Hardest university-level exam questions & multi-part deduction',
                verdict: 'Deepest Reasoning',
            },
            {
                id: 'llama-3.2-11b-vision-preview',
                name: 'Groq Llama 3.2 11B',
                provider: 'Groq LPU',
                speed: 'Instant (~0.8s)',
                speedRank: '⚡⚡⚡⚡⚡ (Fastest Overall)',
                reasoning: 'Good (3.5/5)',
                dailyQuota: '7,000 / day',
                bestFor: 'Virtually unlimited daily usage & hardware-accelerated speed',
                verdict: 'Massive Quota',
            },
            {
                id: 'llama-3.2-90b-vision-preview',
                name: 'Groq Llama 3.2 90B',
                provider: 'Groq LPU',
                speed: 'Fast (~1.8s)',
                speedRank: '⚡⚡⚡⚡',
                reasoning: 'High (4.5/5)',
                dailyQuota: '3,500 / day',
                bestFor: 'Open-weights accuracy on charts and complex question figures',
                verdict: 'Accurate Open Vision',
            },
        ];

        return html`
            <div class="matrix-wrap">
                <table class="matrix-table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Speed</th>
                            <th>Reasoning</th>
                            <th>Free Quota</th>
                            <th>Which is Better / Best For</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${modelsList.map(m => {
                            const isCurrent = this.examVisionModel === m.id;
                            return html`
                                <tr class="${isCurrent ? 'active-model-row' : ''}">
                                    <td>
                                        <div style="font-weight:700;color:${isCurrent ? '#facc15' : '#f9fafb'};">${m.name}</div>
                                        <div style="font-size:10px;color:#9ca3af;">${m.provider}</div>
                                    </td>
                                    <td>
                                        <div style="color:#38bdf8;font-weight:600;">${m.speed}</div>
                                        <div style="font-size:9px;color:#9ca3af;">${m.speedRank}</div>
                                    </td>
                                    <td>
                                        <div style="color:#c084fc;font-weight:600;">${m.reasoning}</div>
                                        <div style="font-size:10px;color:#facc15;">${m.verdict}</div>
                                    </td>
                                    <td>
                                        <div style="font-weight:700;color:#10b981;">${m.dailyQuota}</div>
                                    </td>
                                    <td style="max-width:260px;font-size:11px;color:#d1d5db;line-height:1.4;">${m.bestFor}</td>
                                    <td>
                                        <button
                                            class="matrix-select-btn ${isCurrent ? 'current' : ''}"
                                            @click=${() => (!isCurrent ? this.selectModel(m.id) : null)}
                                            ?disabled=${isCurrent}
                                        >
                                            ${isCurrent ? 'Selected' : 'Use Model'}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        })}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderExamSettingsSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.sliders(18)}</span>
                        <span>Test Intelligence & Solver Settings</span>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Search / Capture Trigger</label>
                        <select class="control" .value=${this.examTriggerMode} @change=${this.handleExamTriggerModeChange}>
                            <option value="hotkey">Hotkey Only (Ctrl+Alt+Q / Custom)</option>
                            <option value="click_hold">Click & Hold (No keystrokes detected)</option>
                            <option value="both">Both Hotkey and Click-and-Hold</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Exam Vision Model</label>
                        <select class="control" .value=${this.examVisionModel} @change=${this.handleExamVisionModelChange}>
                            <optgroup label="Google Gemini (Free & High Quota)">
                                <option value="gemini-flash-latest">Gemini Flash (Latest) [Ultra-Fast ~1.2s • 250 RPD • Recommended]</option>
                                <option value="gemini-3.5-flash">Gemini 3.5 Flash [Next-Gen Intelligence & Vision ~1.4s • 250 RPD]</option>
                                <option value="gemini-flash-lite-latest">Gemini Flash-Lite [Blazing Fast ~0.9s • High Quota 500 RPD]</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash [High Precision ~1.5s • 20 RPD Free Limit]</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro [Deep Math & Complex Logic ~3.5s • 20 RPD Free Limit]</option>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview [Elite Reasoning ~4.5s • 20 RPD Free Limit]</option>
                            </optgroup>
                            <optgroup label="Groq LPUs (Requires Groq API Key)">
                                <option value="llama-3.2-11b-vision-preview">Groq Llama 3.2 11B Vision [Blazing LPU Speed ~0.8s • 7,000 RPD]</option>
                                <option value="llama-3.2-90b-vision-preview">
                                    Groq Llama 3.2 90B Vision [High Accuracy Open Vision ~1.8s • 3,500 RPD]
                                </option>
                            </optgroup>
                        </select>
                    </div>

                    ${this.renderActiveModelUsageCard()}
                    ${
                        this.examTriggerMode !== 'hotkey'
                            ? html`
                                  <div class="form-group">
                                      <label class="form-label">Click & Hold Duration</label>
                                      <select
                                          class="control"
                                          .value=${this.clickHoldDuration.toString()}
                                          @change=${this.handleClickHoldDurationChange}
                                      >
                                          <option value="3">3 Seconds</option>
                                          <option value="5">5 Seconds (Optimal stealth)</option>
                                          <option value="7">7 Seconds</option>
                                          <option value="10">10 Seconds (Ultra-safe)</option>
                                      </select>
                                  </div>
                              `
                            : ''
                    }

                    <div class="form-group">
                        <label class="form-label">Screen Capture Region</label>
                        <select class="control" .value=${this.examCaptureRegion} @change=${this.handleExamCaptureRegionChange}>
                            <option value="cursor_crop">Cursor-Centered Crop (Fast, High Precision)</option>
                            <option value="fullscreen">Full Screen Capture</option>
                        </select>
                    </div>

                    ${
                        this.examCaptureRegion === 'cursor_crop'
                            ? html`
                                  <div class="form-group slider-wrap">
                                      <div class="slider-header">
                                          <label class="form-label">Cursor Crop Box Width</label>
                                          <span class="slider-value">${this.cursorCropWidth}px</span>
                                      </div>
                                      <input
                                          class="slider-input"
                                          type="range"
                                          min="400"
                                          max="1600"
                                          step="50"
                                          .value=${this.cursorCropWidth}
                                          @input=${this.handleCropWidthChange}
                                      />
                                  </div>

                                  <div class="form-group slider-wrap">
                                      <div class="slider-header">
                                          <label class="form-label">Cursor Crop Box Height</label>
                                          <span class="slider-value">${this.cursorCropHeight}px</span>
                                      </div>
                                      <input
                                          class="slider-input"
                                          type="range"
                                          min="300"
                                          max="1080"
                                          step="50"
                                          .value=${this.cursorCropHeight}
                                          @input=${this.handleCropHeightChange}
                                      />
                                  </div>
                              `
                            : ''
                    }
                </div>

                <div style="margin-top:10px;font-size:12px;font-weight:700;color:#9ca3af;letter-spacing:0.8px;text-transform:uppercase;">
                    Output Channels & Stealth Signals
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div class="toggle-row" @click=${() => this.handleExamPrefToggle('enableTrayOutput')}>
                        <span class="toggle-icon">${icons.pin(16)}</span>
                        <span class="toggle-label">System Tray Badge (A-Z)</span>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <button
                                class="action-btn-secondary"
                                style="padding:4px 10px;font-size:11px;"
                                @click=${e => {
                                    e.stopPropagation();
                                    this.testTrayBadge();
                                }}
                            >
                                <span>${this.isTestingTray ? 'Badge Set (B)...' : 'Test Tray'}</span>
                            </button>
                            <div class="m3-switch ${this.enableTrayOutput ? 'active' : ''}"></div>
                        </div>
                    </div>
                    <div class="toggle-row" @click=${() => this.handleExamPrefToggle('transparentIdleTray')}>
                        <span class="toggle-icon">${icons.eye(16)}</span>
                        <span class="toggle-label">Transparent Tray When Idle</span>
                        <div class="m3-switch ${this.transparentIdleTray ? 'active' : ''}"></div>
                    </div>
                    <div class="toggle-row" @click=${() => this.handleExamPrefToggle('enableHudOutput')}>
                        <span class="toggle-icon">${icons.shield(16)}</span>
                        <span class="toggle-label">Stealth Answer Window</span>
                        <div class="m3-switch ${this.enableHudOutput ? 'active' : ''}"></div>
                    </div>
                    <div class="toggle-row" @click=${() => this.handleExamPrefToggle('enableScreenPulse')}>
                        <span class="toggle-icon">${icons.lightbulb(16)}</span>
                        <span class="toggle-label">Screen Edge Pulse</span>
                        <div class="m3-switch ${this.enableScreenPulse ? 'active' : ''}"></div>
                    </div>
                    <div class="toggle-row" @click=${() => this.handleExamPrefToggle('enableAudioBeeps')}>
                        <span class="toggle-icon">${icons.headphones(16)}</span>
                        <span class="toggle-label">Earbud Audio Cues</span>
                        <div class="m3-switch ${this.enableAudioBeeps ? 'active' : ''}"></div>
                    </div>
                    <div class="toggle-row" @click=${() => this.handleExamPrefToggle('enableCapsLockIndicator')}>
                        <span class="toggle-icon">${icons.keyboard(16)}</span>
                        <span class="toggle-label">Caps Lock Light (Hardware)</span>
                        <div class="m3-switch ${this.enableCapsLockIndicator ? 'active' : ''}"></div>
                    </div>
                </div>

                <div class="form-grid" style="margin-top:14px;">
                    <div class="form-group">
                        <label class="form-label">Caps Lock Light Behavior</label>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <select class="control" .value=${this.capsLockMode} @change=${this.handleCapsLockModeChange}>
                                <option value="pulse">Pulse Option Count (A=1, B=2, C=3, D=4)</option>
                                <option value="toggle">Toggle On / Off per Answer</option>
                            </select>
                            <button class="action-btn-secondary" @click=${this.testCapsLock}>
                                ${icons.keyboard(14)}
                                <span>${this.isTestingCapsLock ? 'Pulsing LED...' : 'Test Light'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-grid" style="margin-top:14px;">
                    <div class="form-group">
                        <label class="form-label">Screen Pulse Color</label>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <select class="control" .value=${this.screenPulseColor} @change=${this.handleScreenPulseColorChange}>
                                <option value="#facc15">Cyber Yellow (#facc15)</option>
                                <option value="#06b6d4">Cyan Glow (#06b6d4)</option>
                                <option value="#10b981">Emerald Green (#10b981)</option>
                                <option value="#8b5cf6">Violet (#8b5cf6)</option>
                                <option value="#ef4444">Ruby Red (#ef4444)</option>
                            </select>
                            <button class="action-btn-secondary" @click=${this.testScreenPulse}>
                                ${icons.lightbulb(14)}
                                <span>Test Pulse</span>
                            </button>
                        </div>
                    </div>

                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Earbud Beep Volume</label>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span class="slider-value">${Math.round(this.beepVolume * 100)}%</span>
                                <button class="action-btn-secondary" @click=${this.testEarbudBeep}>
                                    ${icons.volume(14)}
                                    <span>Test Audio</span>
                                </button>
                            </div>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="0.05"
                            max="1.0"
                            step="0.05"
                            .value=${this.beepVolume}
                            @input=${this.handleBeepVolumeChange}
                        />
                    </div>
                </div>
            </section>
        `;
    }

    renderStealthAndSecuritySection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.shield(18)}</span>
                        <span>Stealth & Capture Protection</span>
                    </div>
                </div>
                <div class="surface-subtitle">
                    Advanced defenses against proctoring software, Zoom, Microsoft Teams, Google Meet, and screen recorders.
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
                    <div class="toggle-row" @click=${this.handleContentProtectionToggle}>
                        <span class="toggle-icon">${icons.shield(16)}</span>
                        <span class="toggle-label">Anti-Screen Share Exclusion (SetWindowDisplayAffinity WDA_EXCLUDEFROMCAPTURE)</span>
                        <div class="m3-switch ${this.contentProtection ? 'active' : ''}"></div>
                    </div>
                    <div class="toggle-row" @click=${this.handleAutoScrollToggle}>
                        <span class="toggle-icon">${icons.scroll(16)}</span>
                        <span class="toggle-label">Auto-Scroll Teleprompter Responses</span>
                        <div class="m3-switch ${this.autoScrollEnabled ? 'active' : ''}"></div>
                    </div>
                    <div class="toggle-row" @click=${() => this.handleGoogleSearchChange({ target: { checked: !this.googleSearchEnabled } })}>
                        <span class="toggle-icon">${icons.search(16)}</span>
                        <span class="toggle-label">Live Google Search Augmentation</span>
                        <div class="m3-switch ${this.googleSearchEnabled ? 'active' : ''}"></div>
                    </div>
                </div>
            </section>
        `;
    }

    renderAudioSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.mic(18)}</span>
                        <span>Speech & Audio Input</span>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Audio Mode</label>
                        <select class="control" .value=${this.audioMode} @change=${this.handleAudioModeSelect}>
                            <option value="speaker_only">Speaker Only (Interviewer Voice)</option>
                            <option value="mic_only">Microphone Only (Candidate Voice)</option>
                            <option value="both">Both Speaker and Microphone</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Image Quality</label>
                        <select class="control" .value=${this.selectedImageQuality} @change=${this.handleImageQualitySelect}>
                            <option value="high">High Quality (Detailed OCR)</option>
                            <option value="medium">Medium Quality (Recommended)</option>
                            <option value="low">Low Quality (Fastest Transfer)</option>
                        </select>
                    </div>
                </div>
            </section>
        `;
    }

    renderLanguageSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.globe(18)}</span>
                        <span>Language & Speech Recognition</span>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Speech Language</label>
                        <select class="control" .value=${this.selectedLanguage} @change=${this.handleLanguageSelect}>
                            ${this.getLanguages().map(language => html`<option value=${language.value}>${language.name}</option>`)}
                        </select>
                    </div>
                </div>
            </section>
        `;
    }

    renderAppearanceSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.palette(18)}</span>
                        <span>Appearance & UI Tuning</span>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Theme</label>
                        <select class="control" .value=${this.theme} @change=${this.handleThemeChange}>
                            ${this.getThemes().map(theme => html`<option value=${theme.value}>${theme.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Background Transparency</label>
                            <span class="slider-value">${Math.round(this.backgroundTransparency * 100)}%</span>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            .value=${this.backgroundTransparency}
                            @input=${this.handleBackgroundTransparencyChange}
                        />
                    </div>
                    <div class="form-group slider-wrap">
                        <div class="slider-header">
                            <label class="form-label">Response Font Size</label>
                            <span class="slider-value">${this.fontSize}px</span>
                        </div>
                        <input
                            class="slider-input"
                            type="range"
                            min="12"
                            max="32"
                            step="1"
                            .value=${this.fontSize}
                            @input=${this.handleFontSizeChange}
                        />
                    </div>
                </div>
            </section>
        `;
    }

    renderKeyboardSection() {
        return html`
            <section class="m3-surface">
                <div class="surface-header">
                    <div class="surface-title">
                        <span class="surface-icon">${icons.keyboard(18)}</span>
                        <span>Keyboard Shortcuts & Hotkeys</span>
                    </div>
                    <button class="action-btn-secondary" style="font-size:11px;padding:6px 14px;" @click=${this.resetKeybinds}>
                        Reset to Defaults
                    </button>
                </div>
                <div class="surface-subtitle">Click any shortcut field and press your desired key combination to remap.</div>
                <div style="margin-top:6px;">
                    ${this.getKeybindActions().map(
                        action => html`
                            <div class="keybind-row">
                                <span class="keybind-name">${action.name}</span>
                                <input
                                    type="text"
                                    class="keybind-input"
                                    .value=${this.keybinds[action.key] || ''}
                                    data-action=${action.key}
                                    @keydown=${this.handleKeybindInput}
                                    @focus=${this.handleKeybindFocus}
                                    readonly
                                />
                            </div>
                        `
                    )}
                </div>
            </section>
        `;
    }

    renderPrivacySection() {
        return html`
            <section class="m3-surface danger-surface">
                <div class="surface-header">
                    <div class="surface-title" style="color:#f87171;">
                        <span style="color:#ef4444;display:flex;">${icons.alertTriangle(18)}</span>
                        <span>Privacy & Local Data Management</span>
                    </div>
                </div>
                <div class="surface-subtitle">
                    All configuration and credentials are saved strictly on your local machine. You can reset or wipe all data anytime.
                </div>
                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;">
                    <button class="danger-button" @click=${this.restoreAllSettings} ?disabled=${this.isRestoring}>
                        ${this.isRestoring ? 'Restoring Defaults...' : 'Restore All Settings'}
                    </button>
                    <button class="danger-button" @click=${this.clearLocalData} ?disabled=${this.isClearing}>
                        ${this.isClearing ? 'Wiping Local Data...' : 'Wipe All Data & Quit'}
                    </button>
                </div>
                ${
                    this.clearStatusMessage
                        ? html` <div class="status ${this.clearStatusType === 'success' ? 'success' : 'error'}">${this.clearStatusMessage}</div> `
                        : ''
                }
            </section>
        `;
    }

    render() {
        return html`
            <div class="m3-container">
                <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px;">
                    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Settings & Preferences</div>
                    <div style="font-size:12px;color:#9ca3af;">
                        Configure your BYOK AI keys, stealth output channels, hotkeys, and display parameters.
                    </div>
                </div>

                ${this.renderModeSection()} ${this.renderBYOKSection()} ${this.renderExamSettingsSection()} ${this.renderStealthAndSecuritySection()}
                ${this.renderAudioSection()} ${this.renderLanguageSection()} ${this.renderAppearanceSection()} ${this.renderKeyboardSection()}
                ${this.renderPrivacySection()}
            </div>
        `;
    }
}

customElements.define('customize-view', CustomizeView);
