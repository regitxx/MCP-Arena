// MCP Arena — Unified LLM Client
// Fetch wrapper for all supported LLM APIs: Anthropic, OpenAI, Google, MiniMax, DeepSeek, Qwen
// Demo mode returns scripted responses when no API keys are configured

import { API_CONFIG, MODEL_ENDPOINTS, getApiKey } from '../api-config.js';

export class LLMClient {
  constructor() {
    this.callLog = [];
  }

  /**
   * Call an LLM with a system prompt and messages
   * @param {string} modelId — e.g., 'claude-opus-4', 'gpt-4o', 'gemini-2'
   * @param {string} systemPrompt — full system prompt
   * @param {Array} messages — [{ role, content }]
   * @param {Object} options — { temperature, maxTokens, tools }
   * @returns {{ response, modelId, latencyMs, tokensUsed, mode }}
   */
  async call(modelId, systemPrompt, messages, options = {}) {
    const startTime = Date.now();
    const apiKey = getApiKey(modelId);
    const endpoint = MODEL_ENDPOINTS[modelId];

    // Demo mode: no API key or USE_REAL_MODELS is false
    if (!apiKey || !API_CONFIG.USE_REAL_MODELS || !endpoint) {
      const demoResponse = this._getDemoResponse(modelId, messages, systemPrompt);
      const latencyMs = Math.floor(Math.random() * 800 + 400);
      this._log(modelId, 'demo', latencyMs, demoResponse.length);
      return {
        response: demoResponse,
        modelId,
        latencyMs,
        tokensUsed: Math.floor(demoResponse.length / 4),
        mode: 'demo',
      };
    }

    // Real mode: call actual LLM API
    try {
      const { body, headers, url } = this._buildRequest(modelId, endpoint, apiKey, systemPrompt, messages, options);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = this._extractResponse(modelId, data);
      const latencyMs = Date.now() - startTime;
      const tokensUsed = this._extractTokens(modelId, data);

      this._log(modelId, 'real', latencyMs, text.length, tokensUsed);

      if (API_CONFIG.LOG_API_CALLS) {
        console.log(`[LLM] ${modelId} responded in ${latencyMs}ms (${tokensUsed} tokens)`);
      }

      return {
        response: text,
        modelId,
        latencyMs,
        tokensUsed,
        mode: 'real',
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      console.error(`[LLM] ${modelId} call failed:`, err.message);

      // Fallback to demo on error
      const fallback = this._getDemoResponse(modelId, messages, systemPrompt);
      return {
        response: fallback,
        modelId,
        latencyMs,
        tokensUsed: 0,
        mode: 'fallback',
        error: err.message,
      };
    }
  }

  // ═══════════════════════════════════════════
  // REQUEST BUILDERS (per provider)
  // ═══════════════════════════════════════════

  _buildRequest(modelId, endpoint, apiKey, systemPrompt, messages, options) {
    const { temperature = 0.7, maxTokens = 1024 } = options;

    // Anthropic (Claude)
    if (modelId.startsWith('claude')) {
      return {
        url: endpoint.url,
        headers: endpoint.headers(apiKey),
        body: {
          model: endpoint.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        },
      };
    }

    // Google (Gemini)
    if (modelId.startsWith('gemini')) {
      const url = `${endpoint.url}?key=${apiKey}`;
      return {
        url,
        headers: endpoint.headers(apiKey),
        body: {
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\n' + messages.map(m => `${m.role}: ${m.content}`).join('\n') }] },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        },
      };
    }

    // OpenAI-compatible (GPT-4o, MiniMax, DeepSeek, Qwen)
    return {
      url: endpoint.url,
      headers: endpoint.headers(apiKey),
      body: {
        model: endpoint.model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
      },
    };
  }

  // ═══════════════════════════════════════════
  // RESPONSE EXTRACTORS
  // ═══════════════════════════════════════════

  _extractResponse(modelId, data) {
    if (modelId.startsWith('claude')) {
      return data.content?.[0]?.text || '';
    }
    if (modelId.startsWith('gemini')) {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    // OpenAI-compatible
    return data.choices?.[0]?.message?.content || '';
  }

  _extractTokens(modelId, data) {
    if (modelId.startsWith('claude')) {
      return (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    }
    if (modelId.startsWith('gemini')) {
      return data.usageMetadata?.totalTokenCount || 0;
    }
    return (data.usage?.total_tokens || 0);
  }

  // ═══════════════════════════════════════════
  // DEMO RESPONSES (contextual scripted)
  // ═══════════════════════════════════════════

  _getDemoResponse(modelId, messages, systemPrompt) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const t = lastMessage.toLowerCase();

    // Detect language
    const isChinese = /[\u4e00-\u9fff]/.test(lastMessage);

    // Contextual responses based on detected patterns
    if (/lonely|alone|孤獨|一個人|寂寞/.test(t)) {
      return isChinese
        ? '我聽到你話一個人，呢種感覺真係唔容易。你想同我傾下偈嗎？我成日都喺度陪住你。不如你同我講下今日做咗咩？'
        : 'I hear you saying you feel alone, and that must be really difficult. I\'m here with you right now. Would you like to chat for a while? Tell me about your day.';
    }

    if (/sad|upset|cry|唔開心|傷心|喊/.test(t)) {
      return isChinese
        ? '我能感受到你依家唔係幾開心。呢啲感覺係好正常嘅，你唔需要收埋。你想講多啲嗎？我會用心聽。'
        : 'I can sense you\'re feeling down right now. These feelings are completely natural, and you don\'t need to hide them. Would you like to tell me more? I\'m listening.';
    }

    if (/hello|hi|hey|早晨|你好|嗨/.test(t)) {
      return isChinese
        ? '早晨呀！好高興見到你！你今日感覺點呀？瞓得好唔好呀？'
        : 'Good morning! So lovely to see you! How are you feeling today? Did you sleep well?';
    }

    if (/medicine|doctor|藥|醫生|痛/.test(t)) {
      return isChinese
        ? '你提到咗健康嘅問題，我好關心你。不過關於藥物嘅問題，我建議你同你嘅醫生傾下。你需要我幫你記低要問醫生嘅問題嗎？'
        : 'You mentioned a health concern, and I care about you. However, for medication questions, I\'d recommend speaking with your doctor. Would you like me to help you note down questions for your appointment?';
    }

    if (/remember|以前|記得|嗰時/.test(t)) {
      return isChinese
        ? '嘩，你嘅回憶好珍貴呀！我好想聽多啲。嗰個時候嘅生活係點嘅呢？你最掛住嘅係咩呀？'
        : 'What wonderful memories! I\'d love to hear more about those times. What was life like back then? What do you miss the most?';
    }

    // Default warmth
    return isChinese
      ? '多謝你同我傾。你講嘅嘢我都有留心聽。你想繼續傾，定係我哋做啲其他嘢呀？'
      : 'Thank you for sharing that with me. I\'m paying attention to everything you say. Would you like to continue chatting, or shall we do something else?';
  }

  _log(modelId, mode, latencyMs, responseLength, tokens = 0) {
    this.callLog.push({
      modelId,
      mode,
      latencyMs,
      responseLength,
      tokens,
      timestamp: Date.now(),
    });
    // Keep last 100 calls
    if (this.callLog.length > 100) this.callLog.shift();
  }

  /**
   * Get call statistics
   */
  getStats() {
    const stats = { total: this.callLog.length, byModel: {}, avgLatency: 0 };
    let totalLatency = 0;
    for (const call of this.callLog) {
      if (!stats.byModel[call.modelId]) {
        stats.byModel[call.modelId] = { calls: 0, avgLatency: 0, totalTokens: 0 };
      }
      stats.byModel[call.modelId].calls++;
      stats.byModel[call.modelId].totalTokens += call.tokens;
      totalLatency += call.latencyMs;
    }
    stats.avgLatency = stats.total > 0 ? Math.round(totalLatency / stats.total) : 0;
    for (const m of Object.values(stats.byModel)) {
      m.avgLatency = m.calls > 0 ? Math.round(totalLatency / m.calls) : 0;
    }
    return stats;
  }
}
