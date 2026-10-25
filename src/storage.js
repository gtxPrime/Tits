const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_VERSION = 1;

// Default values
const DEFAULT_CONFIG = {
    configVersion: CONFIG_VERSION,
    onboarded: true,
    layout: 'normal',
    geminiLiveModel: 'gemini-3.1-flash-live-preview',
    groqModel: 'qwen/qwen3.6-27b',
    groqImageModel: 'qwen/qwen3.6-27b',
    disableGroqThinking: true,
};

const DEFAULT_CREDENTIALS = {
    apiKey: '',
    groqApiKey: '',
};

const DEFAULT_PREFERENCES = {
    customPrompt: '',
    providerMode: 'byok',
    selectedProfile: 'interview',
    selectedLanguage: 'en-US',
    selectedScreenshotInterval: '5',
    selectedImageQuality: 'medium',
    advancedMode: false,
    audioMode: 'speaker_only',
    fontSize: 'medium',
    backgroundTransparency: 0.8,
    googleSearchEnabled: false,
    localLlmModel: 'unsloth/Qwen3.5-4B-GGUF:Q4_K_M',
    whisperModel: 'tiny.en',
    appMode: 'test', // 'test' (Exam Solver) | 'interview' (Teleprompter)
    contentProtection: false, // SetWindowDisplayAffinity screen capture stealth
    examTriggerMode: 'hotkey', // 'hotkey', 'click_hold', 'both'
    examCaptureRegion: 'cursor_crop', // 'cursor_crop', 'fullscreen'
    cursorCropWidth: 850,
    cursorCropHeight: 600,
    clickHoldDuration: 5,
    enableTrayOutput: true,
    transparentIdleTray: false,
    enableHudOutput: true,
    enableScreenPulse: true,
    enableAudioBeeps: true,
    enableCapsLockIndicator: false,
    capsLockMode: 'pulse',
    screenPulseColor: '#facc15',
    screenPulseDuration: 800,
    beepPitch: 880,
    beepVolume: 0.2,
    examVisionModel: 'gemini-flash-latest',
    interviewModel: 'gemini-flash-latest',
    vadSensitivity: 0.5,
    autoScrollEnabled: true,
    solveExamKeybind: 'Ctrl+Alt+Q',
};

const DEFAULT_KEYBINDS = null; // null means use system defaults

const MODEL_CATALOG = {
    'gemini-flash-latest': {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash (Latest)',
        provider: 'Google Gemini',
        dailyLimit: 250,
        speedRating: 5,
        reasoningRating: 4,
        speedLabel: 'Ultra-Fast (~1.2s)',
        badge: 'Recommended',
        tagline: 'Best all-rounder: ultra-fast responses, high accuracy, and 250 RPD quota',
        comparison: 'Faster than Pro models, with 12x higher free quota than 2.5-flash (250 vs 20 RPD). Ideal for standard exams.',
    },
    'gemini-3.5-flash': {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        provider: 'Google Gemini',
        dailyLimit: 250,
        speedRating: 5,
        reasoningRating: 4.5,
        speedLabel: 'Very Fast (~1.4s)',
        badge: 'Smarter & Fast',
        tagline: 'Next-gen vision model with enhanced multimodal reasoning and OCR',
        comparison: 'Higher reasoning power than standard Flash with comparable speed and generous 250 RPD quota.',
    },
    'gemini-flash-lite-latest': {
        id: 'gemini-flash-lite-latest',
        name: 'Gemini Flash-Lite (Latest)',
        provider: 'Google Gemini',
        dailyLimit: 500,
        speedRating: 5,
        reasoningRating: 3.5,
        speedLabel: 'Blazing Fast (~0.9s)',
        badge: 'Highest Free Quota',
        tagline: 'Maximum throughput with 500 requests per day for high-volume tests',
        comparison: 'Fastest of all Gemini models with double the daily quota of Flash. Best for rapid-fire MCQs.',
    },
    'gemini-2.5-flash': {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google Gemini',
        dailyLimit: 20,
        speedRating: 4.5,
        reasoningRating: 4.5,
        speedLabel: 'Fast (~1.5s)',
        badge: 'High Precision',
        tagline: 'Balanced reasoning and speed (Note: Free Tier has a strict 20 RPD limit)',
        comparison: 'Strong STEM performance, but limited to 20 free requests/day. Best if you have a paid Google Cloud key.',
    },
    'gemini-2.5-pro': {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google Gemini',
        dailyLimit: 20,
        speedRating: 3,
        reasoningRating: 5,
        speedLabel: 'Moderate (~3.5s)',
        badge: 'Best Reasoning',
        tagline: 'State-of-the-art problem solving for complex math, engineering, and logic',
        comparison: 'Slower than Flash, but provides deepest multi-step deduction for difficult questions.',
    },
    'gemini-3.1-pro-preview': {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro Preview',
        provider: 'Google Gemini',
        dailyLimit: 20,
        speedRating: 2.5,
        reasoningRating: 5,
        speedLabel: 'Thorough (~4.5s)',
        badge: 'Elite Analysis',
        tagline: 'Google cutting-edge reasoning model for university-level and tricky questions',
        comparison: 'Maximum accuracy on nuanced diagrams and multi-part questions at the expense of speed.',
    },
    'llama-3.2-11b-vision-preview': {
        id: 'llama-3.2-11b-vision-preview',
        name: 'Groq Llama 3.2 11B Vision',
        provider: 'Groq LPUs',
        dailyLimit: 7000,
        speedRating: 5,
        reasoningRating: 3.5,
        speedLabel: 'Ultra-Fast LPU (~0.8s)',
        badge: 'Massive Quota (7k/day)',
        tagline: 'Open-weights vision model accelerated on Groq LPUs with 7,000 requests/day',
        comparison: 'Blazing fast inference speed and virtually unlimited daily quota for all-day test sessions.',
    },
    'llama-3.2-90b-vision-preview': {
        id: 'llama-3.2-90b-vision-preview',
        name: 'Groq Llama 3.2 90B Vision',
        provider: 'Groq LPUs',
        dailyLimit: 3500,
        speedRating: 4,
        reasoningRating: 4.5,
        speedLabel: 'Fast LPU (~1.8s)',
        badge: 'High Accuracy Open-Source',
        tagline: '90B parameter flagship open vision model on Groq hardware',
        comparison: 'Dramatically more accurate than 11B on intricate questions while maintaining a huge 3,500 RPD quota.',
    },
};

const DEFAULT_LIMITS = {
    data: [], // Array of { date: 'YYYY-MM-DD', models: {}, flash: { count }, flashLite: { count } }
};

// Get the config directory path based on OS
function getConfigDir() {
    const platform = os.platform();
    let baseDir;

    if (platform === 'win32') {
        baseDir = path.join(os.homedir(), 'AppData', 'Roaming');
    } else if (platform === 'darwin') {
        baseDir = path.join(os.homedir(), 'Library', 'Application Support');
    } else {
        baseDir = path.join(os.homedir(), '.config');
    }

    return path.join(baseDir, 'tits-config');
}

// File paths
function getConfigPath() {
    return path.join(getConfigDir(), 'config.json');
}

function getCredentialsPath() {
    return path.join(getConfigDir(), 'credentials.json');
}

function getPreferencesPath() {
    return path.join(getConfigDir(), 'preferences.json');
}

function getKeybindsPath() {
    return path.join(getConfigDir(), 'keybinds.json');
}

function getLimitsPath() {
    return path.join(getConfigDir(), 'limits.json');
}

function getHistoryDir() {
    return path.join(getConfigDir(), 'history');
}

// Helper to read JSON file safely
function readJsonFile(filePath, defaultValue) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn(`Error reading ${filePath}:`, error.message);
    }
    return defaultValue;
}

// Helper to write JSON file safely
function writeJsonFile(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
        return false;
    }
}

// Check if we need to reset (no configVersion or wrong version)
function needsReset() {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        return true;
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return !config.configVersion || config.configVersion !== CONFIG_VERSION;
    } catch {
        return true;
    }
}

// Wipe and reinitialize the config directory
function resetConfigDir() {
    const configDir = getConfigDir();

    console.log('Resetting config directory...');

    // Remove existing directory if it exists
    if (fs.existsSync(configDir)) {
        fs.rmSync(configDir, { recursive: true, force: true });
    }

    // Create fresh directory structure
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(getHistoryDir(), { recursive: true });

    // Initialize with defaults
    writeJsonFile(getConfigPath(), DEFAULT_CONFIG);
    writeJsonFile(getCredentialsPath(), DEFAULT_CREDENTIALS);
    writeJsonFile(getPreferencesPath(), DEFAULT_PREFERENCES);

    console.log('Config directory initialized with defaults');
}

// Initialize storage - call this on app startup
function initializeStorage() {
    if (needsReset()) {
        resetConfigDir();
    } else {
        // Ensure history directory exists
        const historyDir = getHistoryDir();
        if (!fs.existsSync(historyDir)) {
            fs.mkdirSync(historyDir, { recursive: true });
        }
    }
}

// ============ CONFIG ============

function getConfig() {
    const saved = readJsonFile(getConfigPath(), {});
    return { ...DEFAULT_CONFIG, ...saved };
}

function setConfig(config) {
    const current = getConfig();
    const updated = { ...current, ...config, configVersion: CONFIG_VERSION };
    return writeJsonFile(getConfigPath(), updated);
}

function updateConfig(key, value) {
    const config = getConfig();
    config[key] = value;
    return writeJsonFile(getConfigPath(), config);
}

// ============ CREDENTIALS ============

function getCredentials() {
    return readJsonFile(getCredentialsPath(), DEFAULT_CREDENTIALS);
}

function setCredentials(credentials) {
    const current = getCredentials();
    const updated = { ...current, ...credentials };
    return writeJsonFile(getCredentialsPath(), updated);
}

function sanitizeApiKey(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let key = raw.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1).trim();
    }
    return key;
}

function getApiKey() {
    const creds = getCredentials();
    const key = creds.apiKey || process.env.GEMINI_API_KEY || '';
    return sanitizeApiKey(key);
}

function setApiKey(apiKey) {
    return setCredentials({ apiKey: sanitizeApiKey(apiKey) });
}

function getGroqApiKey() {
    const creds = getCredentials();
    const key = creds.groqApiKey || process.env.GROQ_API_KEY || '';
    return sanitizeApiKey(key);
}

function setGroqApiKey(groqApiKey) {
    return setCredentials({ groqApiKey: sanitizeApiKey(groqApiKey) });
}

// ============ PREFERENCES ============

function getPreferences() {
    const saved = readJsonFile(getPreferencesPath(), {});
    const preferences = { ...DEFAULT_PREFERENCES, ...saved };
    const legacyWhisperModels = {
        'Xenova/whisper-tiny': 'tiny.en',
        'Xenova/whisper-base': 'base.en',
        'Xenova/whisper-small': 'small.en',
    };

    preferences.whisperModel = legacyWhisperModels[preferences.whisperModel] || preferences.whisperModel;
    return preferences;
}

function setPreferences(preferences) {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    return writeJsonFile(getPreferencesPath(), updated);
}

function updatePreference(key, value) {
    const preferences = getPreferences();
    preferences[key] = value;
    return writeJsonFile(getPreferencesPath(), preferences);
}

// ============ KEYBINDS ============

function getKeybinds() {
    return readJsonFile(getKeybindsPath(), DEFAULT_KEYBINDS);
}

function setKeybinds(keybinds) {
    return writeJsonFile(getKeybindsPath(), keybinds);
}

// ============ LIMITS (Rate Limiting) ============

function getLimits() {
    return readJsonFile(getLimitsPath(), DEFAULT_LIMITS);
}

function setLimits(limits) {
    return writeJsonFile(getLimitsPath(), limits);
}

function getTodayDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getTodayLimits() {
    const limits = getLimits();
    const today = getTodayDateString();

    // Find today's entry
    let todayEntry = limits.data.find(entry => entry.date === today);

    if (todayEntry) {
        if (!todayEntry.models) {
            todayEntry.models = {};
        }
        if (!todayEntry.groq) {
            todayEntry.groq = {
                'qwen3-32b': { chars: 0, limit: 1500000 },
                'gpt-oss-120b': { chars: 0, limit: 600000 },
                'gpt-oss-20b': { chars: 0, limit: 600000 },
                'kimi-k2-instruct': { chars: 0, limit: 600000 },
            };
        }
        if (!todayEntry.gemini) {
            todayEntry.gemini = {
                'gemma-4-26b-a4b-it': { chars: 0 },
            };
        }
        setLimits(limits);
        return todayEntry;
    }

    // No entry for today - clean old entries and create new one
    limits.data = limits.data.filter(entry => entry.date === today);
    const newEntry = {
        date: today,
        models: {},
        flash: { count: 0 },
        flashLite: { count: 0 },
        groq: {
            'qwen3-32b': { chars: 0, limit: 1500000 },
            'gpt-oss-120b': { chars: 0, limit: 600000 },
            'gpt-oss-20b': { chars: 0, limit: 600000 },
            'kimi-k2-instruct': { chars: 0, limit: 600000 },
        },
        gemini: {
            'gemma-4-26b-a4b-it': { chars: 0 },
        },
    };
    limits.data.push(newEntry);
    setLimits(limits);

    return newEntry;
}

function incrementLimitCount(model) {
    const limits = getLimits();
    const today = getTodayDateString();

    // Find or create today's entry
    let todayEntry = limits.data.find(entry => entry.date === today);

    if (!todayEntry) {
        // Clean old entries and create new one
        limits.data = [];
        todayEntry = {
            date: today,
            models: {},
            flash: { count: 0 },
            flashLite: { count: 0 },
        };
        limits.data.push(todayEntry);
    } else {
        // Clean old entries, keep only today
        limits.data = limits.data.filter(entry => entry.date === today);
        if (!todayEntry.models) {
            todayEntry.models = {};
        }
    }

    if (model) {
        todayEntry.models[model] = (todayEntry.models[model] || 0) + 1;

        // Increment legacy counters for backward compatibility
        if (model === 'gemini-2.5-flash' || model === 'gemini-flash-latest') {
            todayEntry.flash = todayEntry.flash || { count: 0 };
            todayEntry.flash.count++;
        } else if (model === 'gemini-2.5-flash-lite' || model === 'gemini-flash-lite-latest') {
            todayEntry.flashLite = todayEntry.flashLite || { count: 0 };
            todayEntry.flashLite.count++;
        }
    }

    setLimits(limits);
    return todayEntry;
}

function getModelUsage(modelName) {
    const todayLimits = getTodayLimits();
    const catalog = MODEL_CATALOG[modelName] || {
        id: modelName,
        name: modelName,
        provider: modelName?.startsWith('llama') ? 'Groq LPUs' : 'Google Gemini',
        dailyLimit: 250,
        speedRating: 4,
        reasoningRating: 4,
        speedLabel: 'Fast',
        badge: 'Custom',
        tagline: 'Custom Model Option',
        comparison: 'Standard model configuration',
    };

    let usedToday = 0;
    if (todayLimits.models && typeof todayLimits.models[modelName] === 'number') {
        usedToday = todayLimits.models[modelName];
    } else if (modelName === 'gemini-2.5-flash' && todayLimits.flash) {
        usedToday = todayLimits.flash.count || 0;
    } else if (modelName === 'gemini-2.5-flash-lite' && todayLimits.flashLite) {
        usedToday = todayLimits.flashLite.count || 0;
    }

    const dailyLimit = catalog.dailyLimit || 250;
    const remaining = Math.max(0, dailyLimit - usedToday);
    const percentUsed = Math.min(100, Math.round((usedToday / dailyLimit) * 100));
    const percentRemaining = Math.max(0, 100 - percentUsed);

    return {
        model: modelName,
        meta: catalog,
        usedToday,
        dailyLimit,
        remaining,
        percentUsed,
        percentRemaining,
        status: remaining === 0 ? 'depleted' : remaining <= Math.round(dailyLimit * 0.2) ? 'low' : 'good',
    };
}

function getAllModelUsages() {
    const result = {};
    for (const key of Object.keys(MODEL_CATALOG)) {
        result[key] = getModelUsage(key);
    }
    return result;
}

function incrementCharUsage(provider, model, charCount) {
    getTodayLimits();

    const limits = getLimits();
    const today = getTodayDateString();
    const todayEntry = limits.data.find(entry => entry.date === today);

    if (todayEntry[provider] && todayEntry[provider][model]) {
        todayEntry[provider][model].chars += charCount;
        setLimits(limits);
    }

    return todayEntry;
}

function getAvailableModel() {
    const todayLimits = getTodayLimits();

    // RPD limits: flash = 20, flash-lite = 20
    // After both exhausted, fall back to flash (for paid API users)
    if (todayLimits.flash.count < 20) {
        return 'gemini-2.5-flash';
    } else if (todayLimits.flashLite.count < 20) {
        return 'gemini-2.5-flash-lite';
    }

    return 'gemini-2.5-flash'; // Default to flash for paid API users
}

function getModelForToday() {
    const todayEntry = getTodayLimits();
    const groq = todayEntry.groq;

    if (groq['gpt-oss-120b'].chars < groq['gpt-oss-120b'].limit) {
        return 'openai/gpt-oss-120b';
    }
    if (groq['gpt-oss-20b'].chars < groq['gpt-oss-20b'].limit) {
        return 'openai/gpt-oss-20b';
    }
    if (groq['kimi-k2-instruct'].chars < groq['kimi-k2-instruct'].limit) {
        return 'moonshotai/kimi-k2-instruct';
    }

    // All limits exhausted
    return null;
}

// ============ HISTORY ============

function getSessionPath(sessionId) {
    return path.join(getHistoryDir(), `${sessionId}.json`);
}

function saveSession(sessionId, data) {
    const sessionPath = getSessionPath(sessionId);

    // Load existing session to preserve metadata
    const existingSession = readJsonFile(sessionPath, null);

    const sessionData = {
        sessionId,
        createdAt: existingSession?.createdAt || parseInt(sessionId),
        lastUpdated: Date.now(),
        // Profile context - set once when session starts
        profile: data.profile || existingSession?.profile || null,
        customPrompt: data.customPrompt || existingSession?.customPrompt || null,
        // Conversation data
        conversationHistory: data.conversationHistory || existingSession?.conversationHistory || [],
        screenAnalysisHistory: data.screenAnalysisHistory || existingSession?.screenAnalysisHistory || [],
    };
    return writeJsonFile(sessionPath, sessionData);
}

function getSession(sessionId) {
    return readJsonFile(getSessionPath(sessionId), null);
}

function getAllSessions() {
    const historyDir = getHistoryDir();

    try {
        if (!fs.existsSync(historyDir)) {
            return [];
        }

        const files = fs
            .readdirSync(historyDir)
            .filter(f => f.endsWith('.json'))
            .sort((a, b) => {
                // Sort by timestamp descending (newest first)
                const tsA = parseInt(a.replace('.json', ''));
                const tsB = parseInt(b.replace('.json', ''));
                return tsB - tsA;
            });

        return files
            .map(file => {
                const sessionId = file.replace('.json', '');
                const data = readJsonFile(path.join(historyDir, file), null);
                if (data) {
                    return {
                        sessionId,
                        createdAt: data.createdAt,
                        lastUpdated: data.lastUpdated,
                        messageCount: data.conversationHistory?.length || 0,
                        screenAnalysisCount: data.screenAnalysisHistory?.length || 0,
                        profile: data.profile || null,
                        customPrompt: data.customPrompt || null,
                    };
                }
                return null;
            })
            .filter(Boolean);
    } catch (error) {
        console.error('Error reading sessions:', error.message);
        return [];
    }
}

function deleteSession(sessionId) {
    const sessionPath = getSessionPath(sessionId);
    try {
        if (fs.existsSync(sessionPath)) {
            fs.unlinkSync(sessionPath);
            return true;
        }
    } catch (error) {
        console.error('Error deleting session:', error.message);
    }
    return false;
}

function deleteAllSessions() {
    const historyDir = getHistoryDir();
    try {
        if (fs.existsSync(historyDir)) {
            const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
            files.forEach(file => {
                fs.unlinkSync(path.join(historyDir, file));
            });
        }
        return true;
    } catch (error) {
        console.error('Error deleting all sessions:', error.message);
        return false;
    }
}

// ============ CLEAR ALL DATA ============

function clearAllData() {
    resetConfigDir();
    return true;
}

module.exports = {
    // Initialization
    initializeStorage,
    getConfigDir,

    // Config
    getConfig,
    setConfig,
    updateConfig,

    // Credentials
    getCredentials,
    setCredentials,
    getApiKey,
    setApiKey,
    getGroqApiKey,
    setGroqApiKey,

    // Preferences
    getPreferences,
    setPreferences,
    updatePreference,
    DEFAULT_PREFERENCES,

    // Keybinds
    getKeybinds,
    setKeybinds,

    // Limits (Rate Limiting)
    getLimits,
    setLimits,
    getTodayLimits,
    incrementLimitCount,
    getAvailableModel,
    incrementCharUsage,
    getModelForToday,
    MODEL_CATALOG,
    getModelUsage,
    getAllModelUsages,

    // History
    saveSession,
    getSession,
    getAllSessions,
    deleteSession,
    deleteAllSessions,

    // Clear all
    clearAllData,
};
