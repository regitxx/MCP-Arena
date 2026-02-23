// MCP Arena - Social Robotics Brain Evaluation
// Types, constants, and shared configuration

export const COLORS = {
  BG: '#050510',
  PANEL: '#0d1117',
  CARD: '#111827',
  HOVER: '#1a2332',
  BORDER: '#1e293b',
  TEXT: '#e2e8f0',
  TEXT_DIM: '#64748b',
  TEXT_BRIGHT: '#f8fafc',
  ACCENT: '#6366f1',
  ACCENT_GLOW: 'rgba(99, 102, 241, 0.3)',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  CYAN: '#22d3ee',
  PINK: '#ec4899',
  ORANGE: '#f97316',
};

export const TOOL_ICONS = {
  // Speech & Voice
  transcribe: '\u{1F399}',
  synthesize: '\u{1F50A}',
  detect_language: '\u{1F30D}',
  assess_pronunciation: '\u{1F4DD}',
  // Emotion & Psychology
  analyze_emotion: '\u{1F9E0}',
  assess_empathy: '\u{1F49C}',
  detect_distress: '\u{1F6A8}',
  suggest_response_tone: '\u{1F3B5}',
  analyze_conversation_flow: '\u{1F4AC}',
  // Companion & Elderly Care
  assess_loneliness: '\u{1F49A}',
  evaluate_engagement: '\u{2B50}',
  check_cognitive_stimulation: '\u{1F9E9}',
  assess_reminiscence_therapy: '\u{1F4F7}',
  evaluate_safety_awareness: '\u{1F6E1}',
  // Language & Understanding
  get_scenario: '\u{1F3AD}',
  evaluate_response: '\u{1F9EA}',
  compare_languages: '\u{1F30F}',
  list_scenarios: '\u{1F4DA}',
  get_cultural_context: '\u{1F3EF}',
  // Cognitive & Reasoning
  assess_context_memory: '\u{1F4BE}',
  evaluate_personalization: '\u{1F464}',
  test_boundary_respect: '\u{1F6D1}',
  assess_topic_navigation: '\u{1F9ED}',
  // Eval
  get_task: '\u{1F4DD}',
  check_completion: '\u{1F4CB}',
  submit_result: '\u2705',
  report_metric: '\u{1F4CA}',
};

export const MODEL_CONFIGS = {
  'claude-opus-4': { name: 'Claude Opus 4', color: '#d97706', speed: 1.0, provider: 'Anthropic' },
  'claude-sonnet-4': { name: 'Claude Sonnet 4', color: '#6366f1', speed: 1.5, provider: 'Anthropic' },
  'gpt-4o': { name: 'GPT-4o', color: '#22c55e', speed: 1.2, provider: 'OpenAI' },
  'minimax-m25': { name: 'MiniMax M2.5', color: '#ec4899', speed: 2.0, provider: 'MiniMax' },
  'gemini-2': { name: 'Gemini 2.0', color: '#3b82f6', speed: 1.3, provider: 'Google' },
  'deepseek-r1': { name: 'DeepSeek R1', color: '#f97316', speed: 1.8, provider: 'DeepSeek' },
  'qwen-2.5': { name: 'Qwen 2.5', color: '#a855f7', speed: 1.6, provider: 'Alibaba' },
};

export const LANGUAGES = {
  en: { code: 'en', name: 'English', native: 'English', flag: '\u{1F1EC}\u{1F1E7}', region: 'Global' },
  'zh-yue': { code: 'zh-yue', name: 'Cantonese', native: '\u5EE3\u6771\u8A71', flag: '\u{1F1ED}\u{1F1F0}', region: 'Hong Kong / Guangdong' },
  'zh-cmn': { code: 'zh-cmn', name: 'Mandarin', native: '\u666E\u901A\u8A71', flag: '\u{1F1E8}\u{1F1F3}', region: 'Mainland China / Taiwan' },
  ja: { code: 'ja', name: 'Japanese', native: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}', region: 'Japan' },
  ko: { code: 'ko', name: 'Korean', native: '\uD55C\uAD6D\uC5B4', flag: '\u{1F1F0}\u{1F1F7}', region: 'Korea' },
};

// ASR engines for speech evaluation
export const ASR_ENGINES = {
  'whisper-v3': { name: 'OpenAI Whisper v3', type: 'open-source', langs: ['en', 'zh-yue', 'zh-cmn', 'ja', 'ko'] },
  'sensevoice': { name: 'FunAudioLLM SenseVoice', type: 'open-source', langs: ['en', 'zh-cmn', 'ja', 'ko'], note: 'Alibaba, strong CJK' },
  'paraformer': { name: 'FunASR Paraformer', type: 'open-source', langs: ['zh-cmn', 'zh-yue'], note: 'Best for Chinese dialects' },
  'wav2vec2-cant': { name: 'Wav2Vec2 Cantonese', type: 'open-source', langs: ['zh-yue'], note: 'Fine-tuned for HK Cantonese' },
  'mms-1b': { name: 'Meta MMS-1B', type: 'open-source', langs: ['en', 'zh-cmn', 'ja', 'ko'], note: '1100+ languages' },
  'nemo-canary': { name: 'NVIDIA NeMo Canary', type: 'open-source', langs: ['en', 'zh-cmn'], note: 'Multilingual + translation' },
  'google-chirp': { name: 'Google Chirp 2', type: 'cloud', langs: ['en', 'zh-yue', 'zh-cmn', 'ja', 'ko'] },
  'azure-speech': { name: 'Azure Speech', type: 'cloud', langs: ['en', 'zh-yue', 'zh-cmn', 'ja', 'ko'] },
};

// TTS engines
export const TTS_ENGINES = {
  'fish-speech': { name: 'Fish Speech', type: 'open-source', note: 'Excellent Cantonese voice cloning' },
  'cosyvoice': { name: 'CosyVoice', type: 'open-source', note: 'Alibaba, natural Chinese' },
  'piper': { name: 'Piper TTS', type: 'open-source', note: 'Fast, lightweight, edge-ready' },
  'coqui-xtts': { name: 'Coqui XTTS v2', type: 'open-source', note: 'Cross-lingual voice cloning' },
  'elevenlabs': { name: 'ElevenLabs', type: 'cloud', note: 'Best quality, multilingual' },
};

// Emotion categories for social robotics
export const EMOTIONS = {
  joy: { label: 'Joy', color: '#fbbf24', icon: '\u{1F60A}' },
  sadness: { label: 'Sadness', color: '#60a5fa', icon: '\u{1F622}' },
  anger: { label: 'Anger', color: '#f87171', icon: '\u{1F620}' },
  fear: { label: 'Fear', color: '#a78bfa', icon: '\u{1F628}' },
  surprise: { label: 'Surprise', color: '#34d399', icon: '\u{1F632}' },
  disgust: { label: 'Disgust', color: '#86efac', icon: '\u{1F922}' },
  neutral: { label: 'Neutral', color: '#94a3b8', icon: '\u{1F610}' },
  loneliness: { label: 'Loneliness', color: '#818cf8', icon: '\u{1F614}' },
  nostalgia: { label: 'Nostalgia', color: '#fca5a5', icon: '\u{1F60C}' },
  confusion: { label: 'Confusion', color: '#fde68a', icon: '\u{1F615}' },
};

export function defineTool(name, description, inputSchema) {
  return { name, description, inputSchema };
}
