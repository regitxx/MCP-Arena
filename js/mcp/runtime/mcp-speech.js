// MCP Arena — Runtime Speech Server
// ASR/TTS interface: demo mode uses Web Speech API stubs, real mode calls Whisper/Fish Speech
// Tools: transcribe, synthesize, get_voices, get_speech_config

import { API_CONFIG } from '../../api-config.js';

export class MCPSpeechServer {
  constructor() {
    this.name = 'mcp-speech';
    this.description = 'Speech recognition (ASR) and synthesis (TTS) interface';
    this.voices = this._getAvailableVoices();
  }

  getTools() {
    return [
      {
        name: 'transcribe',
        description: 'Convert speech audio to text (ASR)',
        inputSchema: {
          type: 'object',
          properties: {
            audioData: { type: 'string', description: 'Base64-encoded audio or "demo" for simulated input' },
            language: { type: 'string', default: 'auto', description: 'Language hint (cantonese, mandarin, english, auto)' },
            engine: { type: 'string', default: 'auto', description: 'ASR engine to use' },
          },
          required: ['audioData'],
        },
      },
      {
        name: 'synthesize',
        description: 'Convert text to speech audio (TTS)',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to speak' },
            language: { type: 'string', default: 'cantonese' },
            voice: { type: 'string', default: 'default', description: 'Voice ID or name' },
            speed: { type: 'number', default: 1.0, minimum: 0.5, maximum: 2.0 },
            engine: { type: 'string', default: 'auto' },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_voices',
        description: 'List available TTS voices for a language',
        inputSchema: {
          type: 'object',
          properties: {
            language: { type: 'string', default: 'all' },
          },
        },
      },
      {
        name: 'get_speech_config',
        description: 'Get current speech engine configuration and capabilities',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'transcribe':
        return this._transcribe(params);
      case 'synthesize':
        return this._synthesize(params);
      case 'get_voices':
        return this._getVoicesForLanguage(params.language || 'all');
      case 'get_speech_config':
        return this._getConfig();
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  // ═══════════════════════════════════════════
  // ASR — Speech to Text
  // ═══════════════════════════════════════════

  async _transcribe(params) {
    const { audioData, language = 'auto', engine = 'auto' } = params;

    // Real mode: call Whisper API or Azure Speech
    if (API_CONFIG.USE_REAL_SPEECH && API_CONFIG.AZURE_SPEECH_KEY) {
      return this._transcribeReal(audioData, language);
    }

    // Demo mode: simulate ASR output
    return this._transcribeDemo(language);
  }

  async _transcribeReal(audioData, language) {
    // Azure Speech Services transcription
    try {
      const region = API_CONFIG.AZURE_SPEECH_REGION || 'eastasia';
      const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this._mapLanguageCode(language)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': API_CONFIG.AZURE_SPEECH_KEY,
          'Content-Type': 'audio/wav',
        },
        body: this._base64ToBlob(audioData),
      });

      const result = await response.json();
      return {
        text: result.DisplayText || result.Text || '',
        confidence: result.Confidence || 0.8,
        language: language,
        engine: 'azure-speech',
        latencyMs: 0, // Would measure in real implementation
        mode: 'real',
      };
    } catch (err) {
      return { error: 'ASR failed', details: err.message, mode: 'real' };
    }
  }

  _transcribeDemo(language) {
    // Simulated demo transcriptions
    const demos = {
      cantonese: [
        { text: '早晨呀，今日天氣幾好喎', confidence: 0.92 },
        { text: '我今日覺得有啲唔開心', confidence: 0.88 },
        { text: '你可以同我傾下偈嗎？', confidence: 0.95 },
        { text: '我個仔好耐冇嚟探我喇', confidence: 0.90 },
      ],
      mandarin: [
        { text: '你好，今天天气很好', confidence: 0.94 },
        { text: '我想跟你聊聊天', confidence: 0.91 },
      ],
      english: [
        { text: 'Good morning, how are you today?', confidence: 0.96 },
        { text: 'I\'ve been feeling a bit lonely lately', confidence: 0.89 },
      ],
    };

    const langDemos = demos[language] || demos.cantonese;
    const selected = langDemos[Math.floor(Math.random() * langDemos.length)];

    return {
      ...selected,
      language,
      engine: 'demo',
      latencyMs: Math.floor(Math.random() * 300 + 200),
      mode: 'demo',
    };
  }

  // ═══════════════════════════════════════════
  // TTS — Text to Speech
  // ═══════════════════════════════════════════

  async _synthesize(params) {
    const { text, language = 'cantonese', voice = 'default', speed = 1.0, engine = 'auto' } = params;

    // Real mode: call ElevenLabs or Azure TTS
    if (API_CONFIG.USE_REAL_SPEECH && API_CONFIG.ELEVENLABS_KEY) {
      return this._synthesizeReal(text, language, voice, speed);
    }

    // Demo mode: use Web Speech API if available, else return metadata
    return this._synthesizeDemo(text, language, voice, speed);
  }

  async _synthesizeReal(text, language, voice, speed) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + (voice || 'default'), {
        method: 'POST',
        headers: {
          'xi-api-key': API_CONFIG.ELEVENLABS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            speed,
          },
        }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        return {
          audioUrl: URL.createObjectURL(audioBlob),
          text,
          language,
          voice,
          engine: 'elevenlabs',
          durationMs: text.length * 80, // rough estimate
          mode: 'real',
        };
      }
      return { error: 'TTS failed', status: response.status, mode: 'real' };
    } catch (err) {
      return { error: 'TTS failed', details: err.message, mode: 'real' };
    }
  }

  _synthesizeDemo(text, language, voice, speed) {
    // Try Web Speech API if in browser
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this._mapLanguageCode(language);
        utterance.rate = speed;
        window.speechSynthesis.speak(utterance);
        return {
          text,
          language,
          voice: 'web-speech-api',
          engine: 'web-speech',
          playing: true,
          durationMs: text.length * 100,
          mode: 'demo',
        };
      } catch (e) {
        // Fall through to metadata-only response
      }
    }

    return {
      text,
      language,
      voice,
      engine: 'demo',
      playing: false,
      durationMs: text.length * 100,
      mode: 'demo',
      note: 'Audio synthesis simulated (no browser speech API available)',
    };
  }

  // ═══════════════════════════════════════════
  // VOICE CATALOG
  // ═══════════════════════════════════════════

  _getAvailableVoices() {
    return [
      { id: 'hk-elder-warm', name: 'Warm Elder (HK)', language: 'cantonese', gender: 'female', style: 'warm' },
      { id: 'hk-elder-gentle', name: 'Gentle Elder (HK)', language: 'cantonese', gender: 'male', style: 'gentle' },
      { id: 'hk-young-bright', name: 'Bright Helper (HK)', language: 'cantonese', gender: 'female', style: 'bright' },
      { id: 'zh-caring', name: 'Caring Voice (Mandarin)', language: 'mandarin', gender: 'female', style: 'caring' },
      { id: 'en-warm', name: 'Warm Voice (English)', language: 'english', gender: 'female', style: 'warm' },
      { id: 'en-calm', name: 'Calm Voice (English)', language: 'english', gender: 'male', style: 'calm' },
    ];
  }

  _getVoicesForLanguage(language) {
    if (language === 'all') return { voices: this.voices };
    return { voices: this.voices.filter(v => v.language === language) };
  }

  _getConfig() {
    return {
      realModeEnabled: !!API_CONFIG.USE_REAL_SPEECH,
      asrEngines: {
        available: API_CONFIG.AZURE_SPEECH_KEY ? ['azure-speech', 'demo'] : ['demo'],
        default: API_CONFIG.AZURE_SPEECH_KEY ? 'azure-speech' : 'demo',
      },
      ttsEngines: {
        available: API_CONFIG.ELEVENLABS_KEY ? ['elevenlabs', 'web-speech', 'demo'] : ['web-speech', 'demo'],
        default: API_CONFIG.ELEVENLABS_KEY ? 'elevenlabs' : 'web-speech',
      },
      supportedLanguages: ['cantonese', 'mandarin', 'english'],
      voiceCount: this.voices.length,
    };
  }

  _mapLanguageCode(lang) {
    const map = {
      cantonese: 'zh-HK',
      mandarin: 'zh-CN',
      english: 'en-US',
      auto: 'zh-HK', // Default to Cantonese for HK elderly care
    };
    return map[lang] || lang;
  }

  _base64ToBlob(base64) {
    if (typeof atob === 'undefined') return new Uint8Array(0);
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    } catch {
      return new Uint8Array(0);
    }
  }
}
