// MCP Arena - speech-eval MCP Server
// Evaluates ASR/TTS quality for social robotics across languages
// Integrates open-source ASR benchmarks: Whisper, SenseVoice, Paraformer, Wav2Vec2

import { defineTool, ASR_ENGINES, TTS_ENGINES, LANGUAGES } from '../types.js';

// Simulated ASR benchmark data (based on real-world WER/CER patterns)
const ASR_BENCHMARKS = {
  'whisper-v3': {
    en: { wer: 4.2, cer: 2.1, latency_ms: 320, naturalness: 92 },
    'zh-cmn': { wer: 8.7, cer: 5.3, latency_ms: 380, naturalness: 85 },
    'zh-yue': { wer: 18.4, cer: 12.1, latency_ms: 420, naturalness: 68 },
    ja: { wer: 7.1, cer: 4.8, latency_ms: 350, naturalness: 87 },
    ko: { wer: 9.2, cer: 6.1, latency_ms: 360, naturalness: 84 },
  },
  'sensevoice': {
    en: { wer: 5.1, cer: 2.8, latency_ms: 280, naturalness: 89 },
    'zh-cmn': { wer: 4.3, cer: 2.6, latency_ms: 250, naturalness: 94 },
    'zh-yue': { wer: 14.2, cer: 9.0, latency_ms: 290, naturalness: 75 },
    ja: { wer: 6.8, cer: 4.2, latency_ms: 270, naturalness: 88 },
    ko: { wer: 7.5, cer: 4.9, latency_ms: 280, naturalness: 86 },
  },
  'paraformer': {
    'zh-cmn': { wer: 3.8, cer: 2.2, latency_ms: 200, naturalness: 95 },
    'zh-yue': { wer: 9.6, cer: 6.1, latency_ms: 230, naturalness: 82 },
  },
  'wav2vec2-cant': {
    'zh-yue': { wer: 11.3, cer: 7.2, latency_ms: 180, naturalness: 79 },
  },
  'mms-1b': {
    en: { wer: 6.8, cer: 3.5, latency_ms: 400, naturalness: 83 },
    'zh-cmn': { wer: 11.2, cer: 7.1, latency_ms: 450, naturalness: 78 },
    ja: { wer: 9.5, cer: 6.3, latency_ms: 430, naturalness: 80 },
    ko: { wer: 10.8, cer: 7.0, latency_ms: 440, naturalness: 79 },
  },
  'nemo-canary': {
    en: { wer: 4.5, cer: 2.3, latency_ms: 310, naturalness: 91 },
    'zh-cmn': { wer: 7.2, cer: 4.5, latency_ms: 340, naturalness: 86 },
  },
  'google-chirp': {
    en: { wer: 3.1, cer: 1.5, latency_ms: 150, naturalness: 96 },
    'zh-cmn': { wer: 5.2, cer: 3.0, latency_ms: 170, naturalness: 92 },
    'zh-yue': { wer: 8.9, cer: 5.4, latency_ms: 190, naturalness: 84 },
    ja: { wer: 5.8, cer: 3.6, latency_ms: 160, naturalness: 90 },
    ko: { wer: 6.5, cer: 4.0, latency_ms: 165, naturalness: 88 },
  },
  'azure-speech': {
    en: { wer: 3.5, cer: 1.8, latency_ms: 140, naturalness: 95 },
    'zh-cmn': { wer: 5.8, cer: 3.4, latency_ms: 160, naturalness: 91 },
    'zh-yue': { wer: 10.2, cer: 6.5, latency_ms: 180, naturalness: 80 },
    ja: { wer: 6.2, cer: 3.9, latency_ms: 155, naturalness: 89 },
    ko: { wer: 7.0, cer: 4.3, latency_ms: 160, naturalness: 87 },
  },
};

// TTS evaluation metrics
const TTS_BENCHMARKS = {
  'fish-speech': {
    'zh-yue': { mos: 4.2, naturalness: 88, emotion_range: 82, latency_ms: 450 },
    'zh-cmn': { mos: 4.4, naturalness: 91, emotion_range: 85, latency_ms: 400 },
    en: { mos: 4.0, naturalness: 84, emotion_range: 78, latency_ms: 420 },
  },
  'cosyvoice': {
    'zh-cmn': { mos: 4.5, naturalness: 93, emotion_range: 88, latency_ms: 380 },
    'zh-yue': { mos: 3.8, naturalness: 78, emotion_range: 72, latency_ms: 420 },
    en: { mos: 3.9, naturalness: 80, emotion_range: 75, latency_ms: 400 },
  },
  'piper': {
    en: { mos: 3.6, naturalness: 76, emotion_range: 60, latency_ms: 50 },
    'zh-cmn': { mos: 3.2, naturalness: 68, emotion_range: 55, latency_ms: 60 },
  },
  'coqui-xtts': {
    en: { mos: 4.1, naturalness: 86, emotion_range: 80, latency_ms: 600 },
    'zh-cmn': { mos: 3.7, naturalness: 77, emotion_range: 70, latency_ms: 650 },
    'zh-yue': { mos: 3.4, naturalness: 70, emotion_range: 65, latency_ms: 680 },
  },
  'elevenlabs': {
    en: { mos: 4.7, naturalness: 97, emotion_range: 95, latency_ms: 300 },
    'zh-cmn': { mos: 4.3, naturalness: 89, emotion_range: 82, latency_ms: 350 },
    'zh-yue': { mos: 3.9, naturalness: 80, emotion_range: 74, latency_ms: 380 },
    ja: { mos: 4.2, naturalness: 87, emotion_range: 80, latency_ms: 340 },
    ko: { mos: 4.1, naturalness: 85, emotion_range: 78, latency_ms: 350 },
  },
};

export class SpeechEvalServer {
  constructor(world) {
    this.world = world;
    this.name = 'speech-eval';
    this.description = 'Speech recognition & synthesis evaluation for social robotics. Benchmarks open-source ASRs (Whisper, SenseVoice, Paraformer) and TTS engines across languages.';
    this.results = [];
  }

  getTools() {
    return [
      defineTool('benchmark_asr', 'Benchmark an ASR engine on a specific language. Returns WER, CER, latency, and naturalness scores.', {
        type: 'object',
        properties: {
          engine: { type: 'string', description: 'ASR engine ID' },
          language: { type: 'string', description: 'Language code' },
          scenario: { type: 'string', description: 'Test scenario: elderly_conversation, noisy_mall, emotional_speech, code_switched' },
        },
        required: ['engine', 'language'],
      }),
      defineTool('benchmark_tts', 'Benchmark a TTS engine on a specific language. Returns MOS, naturalness, emotion range.', {
        type: 'object',
        properties: {
          engine: { type: 'string', description: 'TTS engine ID' },
          language: { type: 'string', description: 'Language code' },
          voice_style: { type: 'string', description: 'Voice style: warm_elderly, professional, friendly, empathetic' },
        },
        required: ['engine', 'language'],
      }),
      defineTool('compare_asr_engines', 'Compare all available ASR engines for a specific language.', {
        type: 'object',
        properties: {
          language: { type: 'string', description: 'Language code to compare' },
        },
        required: ['language'],
      }),
      defineTool('compare_tts_engines', 'Compare all available TTS engines for a specific language.', {
        type: 'object',
        properties: {
          language: { type: 'string', description: 'Language code to compare' },
        },
        required: ['language'],
      }),
      defineTool('recommend_speech_stack', 'Get recommended ASR+TTS stack for a specific language and use case.', {
        type: 'object',
        properties: {
          language: { type: 'string' },
          use_case: { type: 'string', description: 'elderly_care, mall_service, hospital, general' },
          priority: { type: 'string', description: 'quality, latency, cost, open_source' },
        },
        required: ['language', 'use_case'],
      }),
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'benchmark_asr': {
        const engine = ASR_ENGINES[params.engine];
        if (!engine) return { success: false, error: `Unknown ASR engine: ${params.engine}`, available: Object.keys(ASR_ENGINES) };
        const benchmarks = ASR_BENCHMARKS[params.engine];
        const langBench = benchmarks?.[params.language];
        if (!langBench) return { success: false, error: `${engine.name} does not support ${params.language}`, supported: engine.langs };

        // Adjust for scenario difficulty
        const scenarioMod = { elderly_conversation: 1.3, noisy_mall: 1.5, emotional_speech: 1.2, code_switched: 1.8 };
        const mod = scenarioMod[params.scenario] || 1.0;
        const adjWer = +(langBench.wer * mod).toFixed(1);
        const adjCer = +(langBench.cer * mod).toFixed(1);
        const score = Math.max(0, Math.round(100 - adjWer * 2.5));

        this.results.push({ type: 'asr', engine: params.engine, language: params.language, score });
        this.world?.addEvent?.({ type: 'speech_eval', detail: 'asr_benchmark' });
        return {
          success: true,
          engine: { id: params.engine, ...engine },
          language: params.language,
          scenario: params.scenario || 'standard',
          metrics: {
            wer: adjWer, cer: adjCer,
            latency_ms: langBench.latency_ms,
            naturalness: langBench.naturalness,
            score,
          },
          message: `${engine.name} \u2192 ${LANGUAGES[params.language]?.name}: WER ${adjWer}%, Score ${score}/100`,
        };
      }

      case 'benchmark_tts': {
        const engine = TTS_ENGINES[params.engine];
        if (!engine) return { success: false, error: `Unknown TTS engine: ${params.engine}`, available: Object.keys(TTS_ENGINES) };
        const benchmarks = TTS_BENCHMARKS[params.engine];
        const langBench = benchmarks?.[params.language];
        if (!langBench) return { success: false, error: `${engine.name} does not support ${params.language}` };

        const score = Math.round((langBench.mos / 5) * 40 + langBench.naturalness * 0.35 + langBench.emotion_range * 0.25);
        this.world?.addEvent?.({ type: 'speech_eval', detail: 'tts_benchmark' });
        return {
          success: true,
          engine: { id: params.engine, ...engine },
          language: params.language,
          voice_style: params.voice_style || 'default',
          metrics: { ...langBench, score },
          message: `${engine.name} \u2192 ${LANGUAGES[params.language]?.name}: MOS ${langBench.mos}, Score ${score}/100`,
        };
      }

      case 'compare_asr_engines': {
        const results = Object.entries(ASR_BENCHMARKS)
          .filter(([_, b]) => b[params.language])
          .map(([id, b]) => ({
            engine: id, name: ASR_ENGINES[id]?.name, type: ASR_ENGINES[id]?.type,
            ...b[params.language],
            score: Math.max(0, Math.round(100 - b[params.language].wer * 2.5)),
          }))
          .sort((a, b) => a.wer - b.wer);
        this.world?.addEvent?.({ type: 'speech_eval', detail: 'asr_comparison' });
        return {
          success: true, language: params.language,
          rankings: results,
          best: results[0]?.name,
          message: `${results.length} ASR engines compared for ${LANGUAGES[params.language]?.name}. Best: ${results[0]?.name} (WER: ${results[0]?.wer}%)`,
        };
      }

      case 'compare_tts_engines': {
        const results = Object.entries(TTS_BENCHMARKS)
          .filter(([_, b]) => b[params.language])
          .map(([id, b]) => ({
            engine: id, name: TTS_ENGINES[id]?.name, type: TTS_ENGINES[id]?.type,
            ...b[params.language],
            score: Math.round((b[params.language].mos / 5) * 40 + b[params.language].naturalness * 0.35 + b[params.language].emotion_range * 0.25),
          }))
          .sort((a, b) => b.mos - a.mos);
        this.world?.addEvent?.({ type: 'speech_eval', detail: 'tts_comparison' });
        return {
          success: true, language: params.language,
          rankings: results,
          best: results[0]?.name,
          message: `${results.length} TTS engines compared for ${LANGUAGES[params.language]?.name}. Best: ${results[0]?.name} (MOS: ${results[0]?.mos})`,
        };
      }

      case 'recommend_speech_stack': {
        const lang = params.language;
        const asrRank = Object.entries(ASR_BENCHMARKS)
          .filter(([_, b]) => b[lang])
          .map(([id, b]) => ({ id, ...b[lang], type: ASR_ENGINES[id]?.type, name: ASR_ENGINES[id]?.name }))
          .sort((a, b) => params.priority === 'latency' ? a.latency_ms - b.latency_ms : a.wer - b.wer);
        const ttsRank = Object.entries(TTS_BENCHMARKS)
          .filter(([_, b]) => b[lang])
          .map(([id, b]) => ({ id, ...b[lang], type: TTS_ENGINES[id]?.type, name: TTS_ENGINES[id]?.name }))
          .sort((a, b) => b.mos - a.mos);

        const osOnly = params.priority === 'open_source';
        const bestAsr = osOnly ? asrRank.find(a => a.type === 'open-source') : asrRank[0];
        const bestTts = osOnly ? ttsRank.find(t => t.type === 'open-source') : ttsRank[0];

        this.world?.addEvent?.({ type: 'speech_eval', detail: 'recommendation' });
        return {
          success: true,
          recommendation: {
            asr: bestAsr ? { engine: bestAsr.id, name: bestAsr.name, wer: bestAsr.wer, latency_ms: bestAsr.latency_ms } : null,
            tts: bestTts ? { engine: bestTts.id, name: bestTts.name, mos: bestTts.mos, latency_ms: bestTts.latency_ms } : null,
            total_latency_ms: (bestAsr?.latency_ms || 0) + (bestTts?.latency_ms || 0),
          },
          language: lang, use_case: params.use_case, priority: params.priority || 'quality',
          message: `Recommended: ${bestAsr?.name || 'N/A'} + ${bestTts?.name || 'N/A'} (total latency: ${(bestAsr?.latency_ms || 0) + (bestTts?.latency_ms || 0)}ms)`,
        };
      }

      default: return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }
}
