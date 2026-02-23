// MCP Arena - API Configuration
// Add your API keys here to enable real model evaluation
// In demo mode (no keys), scripted mock agents are used

export const API_CONFIG = {
  // === LLM API Keys ===
  // These enable real model evaluation instead of scripted demos

  ANTHROPIC_API_KEY: '',    // Claude Opus 4, Sonnet 4 — https://console.anthropic.com
  OPENAI_API_KEY: '',       // GPT-4o — https://platform.openai.com
  GOOGLE_API_KEY: '',       // Gemini 2.0 — https://aistudio.google.com
  MINIMAX_API_KEY: '',      // MiniMax M2.5 — https://www.minimax.chat
  DEEPSEEK_API_KEY: '',     // DeepSeek R1 — https://platform.deepseek.com
  QWEN_API_KEY: '',         // Qwen 2.5 — https://dashscope.aliyun.com

  // === Speech API Keys (Optional) ===
  // Enable real ASR/TTS benchmarking instead of simulated scores

  AZURE_SPEECH_KEY: '',     // Azure Speech Services
  AZURE_SPEECH_REGION: '',  // e.g., 'eastasia'
  GOOGLE_SPEECH_KEY: '',    // Google Chirp 2
  ELEVENLABS_KEY: '',       // ElevenLabs TTS

  // === Feature Flags ===
  USE_REAL_MODELS: false,   // Set to true when API keys are configured
  USE_REAL_SPEECH: false,   // Set to true when speech API keys are configured
  ENABLE_STREAMING: true,   // SSE streaming for real-time updates
  LOG_API_CALLS: true,      // Log all API calls to console for debugging
};

// Model API endpoints
export const MODEL_ENDPOINTS = {
  'claude-opus-4': {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-opus-4-20250514',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }),
  },
  'claude-sonnet-4': {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }),
  },
  'gpt-4o': {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
  },
  'gemini-2': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    headers: (key) => ({
      'content-type': 'application/json',
    }),
  },
  'minimax-m25': {
    url: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    model: 'MiniMax-Text-01',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
  },
  'deepseek-r1': {
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-reasoner',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
  },
  'qwen-2.5': {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-max',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
  },
};

// Check if any real model keys are configured
export function hasApiKeys() {
  return !!(API_CONFIG.ANTHROPIC_API_KEY || API_CONFIG.OPENAI_API_KEY ||
            API_CONFIG.GOOGLE_API_KEY || API_CONFIG.MINIMAX_API_KEY ||
            API_CONFIG.DEEPSEEK_API_KEY || API_CONFIG.QWEN_API_KEY);
}

// Get the API key for a specific model
export function getApiKey(modelId) {
  const keyMap = {
    'claude-opus-4': API_CONFIG.ANTHROPIC_API_KEY,
    'claude-sonnet-4': API_CONFIG.ANTHROPIC_API_KEY,
    'gpt-4o': API_CONFIG.OPENAI_API_KEY,
    'gemini-2': API_CONFIG.GOOGLE_API_KEY,
    'minimax-m25': API_CONFIG.MINIMAX_API_KEY,
    'deepseek-r1': API_CONFIG.DEEPSEEK_API_KEY,
    'qwen-2.5': API_CONFIG.QWEN_API_KEY,
  };
  return keyMap[modelId] || '';
}
