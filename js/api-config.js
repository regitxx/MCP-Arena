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

  // === Free / Open-Source LLM Keys ===
  // These services offer FREE tiers — perfect for testing without paid keys

  GROQ_API_KEY: '',         // Groq — blazing fast, free tier — https://console.groq.com
  OPENROUTER_API_KEY: '',   // OpenRouter — free models available — https://openrouter.ai
  TOGETHER_API_KEY: '',     // Together AI — free tier — https://api.together.xyz

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

// === Free / Open-Source Model Endpoints ===
// These work with free-tier API keys

export const FREE_MODEL_ENDPOINTS = {
  'groq-llama-70b': {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
  },
  'groq-mixtral': {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'mixtral-8x7b-32768',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
    }),
  },
  'openrouter-free': {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    headers: (key) => ({
      'Authorization': `Bearer ${key}`,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://mcp-arena.vercel.app',
    }),
  },
  'together-llama-70b': {
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
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
            API_CONFIG.DEEPSEEK_API_KEY || API_CONFIG.QWEN_API_KEY ||
            API_CONFIG.GROQ_API_KEY || API_CONFIG.OPENROUTER_API_KEY ||
            API_CONFIG.TOGETHER_API_KEY);
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
    // Free tier models
    'groq-llama-70b': API_CONFIG.GROQ_API_KEY,
    'groq-mixtral': API_CONFIG.GROQ_API_KEY,
    'openrouter-free': API_CONFIG.OPENROUTER_API_KEY,
    'together-llama-70b': API_CONFIG.TOGETHER_API_KEY,
  };
  return keyMap[modelId] || '';
}
