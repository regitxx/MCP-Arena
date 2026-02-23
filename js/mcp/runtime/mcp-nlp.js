// MCP Arena — Runtime NLP Server
// Intent/entity/emotion parsing via keyword patterns (demo) or real NLP API (production)
// Tools: parse_intent, detect_emotion, detect_language, extract_entities

export class MCPNlpServer {
  constructor() {
    this.name = 'mcp-nlp';
    this.description = 'Natural language understanding: intent, emotion, language, entities';
  }

  getTools() {
    return [
      {
        name: 'parse_intent',
        description: 'Classify the intent of a user message',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'User message to parse' },
            language: { type: 'string', default: 'auto' },
          },
          required: ['text'],
        },
      },
      {
        name: 'detect_emotion',
        description: 'Detect the emotional state from text',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            language: { type: 'string', default: 'auto' },
          },
          required: ['text'],
        },
      },
      {
        name: 'detect_language',
        description: 'Detect the primary language of the text',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      },
      {
        name: 'extract_entities',
        description: 'Extract named entities (people, places, dates, etc.) from text',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            language: { type: 'string', default: 'auto' },
          },
          required: ['text'],
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'parse_intent':
        return this._parseIntent(params.text, params.language);
      case 'detect_emotion':
        return this._detectEmotion(params.text, params.language);
      case 'detect_language':
        return this._detectLanguage(params.text);
      case 'extract_entities':
        return this._extractEntities(params.text, params.language);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  // ═══════════════════════════════════════════
  // INTENT CLASSIFICATION (keyword-based demo)
  // ═══════════════════════════════════════════

  _parseIntent(text, language) {
    const t = text.toLowerCase();
    const intents = [];

    // Greeting
    if (/^(?:hi|hello|hey|good morning|good afternoon|good evening|早晨|你好|嗨|午安|晚安)/i.test(t)) {
      intents.push({ intent: 'greeting', confidence: 0.95 });
    }

    // Farewell
    if (/(?:bye|goodbye|see you|good night|晚安|拜拜|再見|走啦)/i.test(t)) {
      intents.push({ intent: 'farewell', confidence: 0.9 });
    }

    // Health concern
    if (/(?:pain|hurt|sick|medicine|doctor|hospital|頭痛|唔舒服|食藥|醫生|醫院|痛|病)/i.test(t)) {
      intents.push({ intent: 'health_concern', confidence: 0.85 });
    }

    // Emotional sharing
    if (/(?:feel|feeling|sad|happy|lonely|scared|worried|afraid|開心|唔開心|孤獨|驚|擔心|難過|鍾意)/i.test(t)) {
      intents.push({ intent: 'emotional_sharing', confidence: 0.8 });
    }

    // Seeking information
    if (/(?:what|when|where|how|why|who|tell me|do you know|咩|幾時|邊度|點解|邊個|話我知)/i.test(t)) {
      intents.push({ intent: 'information_seeking', confidence: 0.75 });
    }

    // Reminiscing
    if (/(?:remember|used to|back then|when i was|those days|以前|記得|嗰時|細個時|舊時)/i.test(t)) {
      intents.push({ intent: 'reminiscing', confidence: 0.85 });
    }

    // Activity request
    if (/(?:play|sing|song|game|music|story|唱歌|玩|遊戲|音樂|故事|聽)/i.test(t)) {
      intents.push({ intent: 'activity_request', confidence: 0.8 });
    }

    // Help request
    if (/(?:help|assist|can you|please|幫|可以|唔該|請)/i.test(t)) {
      intents.push({ intent: 'help_request', confidence: 0.7 });
    }

    // Personal sharing
    if (/(?:my name|i am|i live|my family|my son|my daughter|我叫|我住|我嘅|我個仔|我個女)/i.test(t)) {
      intents.push({ intent: 'personal_sharing', confidence: 0.8 });
    }

    // Confusion/disorientation
    if (/(?:where am i|who are you|what time|i don't know|我喺邊|你係邊個|幾點|我唔知)/i.test(t)) {
      intents.push({ intent: 'confusion', confidence: 0.85 });
    }

    // Complaint
    if (/(?:don't like|hate|terrible|awful|唔鍾意|討厭|好差|好衰)/i.test(t)) {
      intents.push({ intent: 'complaint', confidence: 0.75 });
    }

    // Default
    if (intents.length === 0) {
      intents.push({ intent: 'general_conversation', confidence: 0.5 });
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    return {
      primaryIntent: intents[0],
      allIntents: intents,
      inputLength: text.length,
    };
  }

  // ═══════════════════════════════════════════
  // EMOTION DETECTION (keyword-based demo)
  // ═══════════════════════════════════════════

  _detectEmotion(text, language) {
    const t = text.toLowerCase();
    const emotions = [];

    const emotionPatterns = [
      { emotion: 'sadness', intensity: 0.7, patterns: [/sad|upset|cry|tear|miss|唔開心|傷心|喊|掛住|難過/i] },
      { emotion: 'loneliness', intensity: 0.8, patterns: [/lonely|alone|no one|nobody|miss|孤獨|一個人|冇人|寂寞/i] },
      { emotion: 'joy', intensity: 0.7, patterns: [/happy|glad|wonderful|great|love|開心|高興|好嘢|靚|鍾意/i] },
      { emotion: 'anger', intensity: 0.6, patterns: [/angry|mad|furious|annoyed|嬲|火滾|煩|激氣/i] },
      { emotion: 'fear', intensity: 0.75, patterns: [/scared|afraid|frightened|terrified|驚|怕|恐|嚇/i] },
      { emotion: 'anxiety', intensity: 0.7, patterns: [/worried|anxious|nervous|stress|擔心|緊張|壓力|焦慮/i] },
      { emotion: 'confusion', intensity: 0.65, patterns: [/confused|lost|don't understand|唔明|混亂|迷|唔知/i] },
      { emotion: 'gratitude', intensity: 0.6, patterns: [/thank|grateful|appreciate|多謝|感謝|感激|唔該/i] },
      { emotion: 'frustration', intensity: 0.6, patterns: [/frustrated|stuck|can't|impossible|煩|搞唔掂|冇辦法/i] },
      { emotion: 'contentment', intensity: 0.5, patterns: [/fine|okay|good|not bad|幾好|可以|唔錯|OK/i] },
      { emotion: 'grief', intensity: 0.9, patterns: [/died|death|passed away|funeral|gone|死|走咗|殯儀/i] },
      { emotion: 'nostalgia', intensity: 0.6, patterns: [/remember|those days|used to|miss|以前|嗰時|懷念|記得/i] },
    ];

    for (const ep of emotionPatterns) {
      for (const pattern of ep.patterns) {
        if (pattern.test(t)) {
          // Adjust intensity based on emphasis markers
          let intensity = ep.intensity;
          if (/!|！|very|really|so|好|非常|真係/.test(t)) intensity = Math.min(1, intensity + 0.15);
          if (/\.\.\.|\.\.\.|…/.test(t)) intensity = Math.min(1, intensity + 0.05); // trailing off = deeper feeling

          emotions.push({ emotion: ep.emotion, intensity: Math.round(intensity * 100) / 100 });
          break;
        }
      }
    }

    if (emotions.length === 0) {
      emotions.push({ emotion: 'neutral', intensity: 0.3 });
    }

    emotions.sort((a, b) => b.intensity - a.intensity);

    return {
      primaryEmotion: emotions[0],
      allEmotions: emotions,
      emotionalIntensity: emotions[0].intensity,
      needsSupport: emotions[0].intensity > 0.7 &&
        ['sadness', 'loneliness', 'grief', 'fear', 'anxiety'].includes(emotions[0].emotion),
    };
  }

  // ═══════════════════════════════════════════
  // LANGUAGE DETECTION
  // ═══════════════════════════════════════════

  _detectLanguage(text) {
    // CJK Unicode ranges
    const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || [];
    const ascii = text.match(/[a-zA-Z]/g) || [];
    const total = text.length || 1;

    const cjkRatio = cjk.length / total;
    const asciiRatio = ascii.length / total;

    let primary, confidence;

    if (cjkRatio > 0.3) {
      // Check for Cantonese-specific characters
      const cantoneseMarkers = /[嘅啲咗咁嚟佢哋呢嘢喺唔冇啦噉嗰點靚嗮]/;
      if (cantoneseMarkers.test(text)) {
        primary = 'cantonese';
        confidence = 0.9;
      } else {
        // Could be Mandarin written in traditional/simplified
        const simplified = text.match(/[\u4e00-\u9fff]/g) || [];
        primary = simplified.length > 0 ? 'mandarin' : 'cantonese';
        confidence = 0.7;
      }
    } else if (asciiRatio > 0.5) {
      primary = 'english';
      confidence = 0.9;
    } else {
      primary = 'mixed';
      confidence = 0.5;
    }

    // Detect code-switching
    const isCodeSwitching = cjkRatio > 0.1 && asciiRatio > 0.1;

    return {
      primary,
      confidence,
      isCodeSwitching,
      scriptDistribution: {
        cjk: Math.round(cjkRatio * 100),
        ascii: Math.round(asciiRatio * 100),
        other: Math.round((1 - cjkRatio - asciiRatio) * 100),
      },
    };
  }

  // ═══════════════════════════════════════════
  // ENTITY EXTRACTION
  // ═══════════════════════════════════════════

  _extractEntities(text, language) {
    const entities = [];

    // Names (English)
    const namePatterns = [
      { regex: /(?:my name is|i'm|i am|call me)\s+(\w+)/i, type: 'PERSON' },
      { regex: /(?:我叫|我係)(.{1,8})/i, type: 'PERSON' },
    ];

    // Numbers/ages
    const numPatterns = [
      { regex: /(\d+)\s*(?:years? old|歲)/i, type: 'AGE' },
      { regex: /(\d{1,2}):(\d{2})/i, type: 'TIME' },
      { regex: /(\d+)\s*(?:o'clock|點)/i, type: 'TIME' },
    ];

    // Family members
    const familyPatterns = [
      { regex: /my\s+(son|daughter|wife|husband|brother|sister|mother|father|grandson|granddaughter)/i, type: 'FAMILY_MEMBER' },
      { regex: /我(?:個|嘅)\s*(仔|女|老公|老婆|阿哥|家姐|阿媽|阿爸|孫)/i, type: 'FAMILY_MEMBER' },
    ];

    // Locations
    const locationPatterns = [
      { regex: /(?:in|at|from|near|live in)\s+([A-Z]\w+(?:\s+[A-Z]\w+)*)/i, type: 'LOCATION' },
      { regex: /(?:喺|住|嚟|近)(.{2,10}?)(?:嘅|度|住|。|$)/i, type: 'LOCATION' },
    ];

    // Food
    const foodPatterns = [
      { regex: /(?:eat|like|love|want|prefer)\s+(\w+(?:\s+\w+)?)\s+(?:food|dish|soup|rice|noodle)/i, type: 'FOOD' },
      { regex: /(?:食|鍾意食|想食)(.{2,8})/i, type: 'FOOD' },
    ];

    const allPatterns = [...namePatterns, ...numPatterns, ...familyPatterns, ...locationPatterns, ...foodPatterns];

    for (const { regex, type } of allPatterns) {
      const match = text.match(regex);
      if (match) {
        entities.push({
          type,
          value: match[1] || match[0],
          position: match.index,
          confidence: 0.8,
        });
      }
    }

    // Date mentions
    const datePattern = /(?:yesterday|today|tomorrow|last week|next week|尋日|今日|聽日|上個禮拜|下個禮拜)/i;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      entities.push({
        type: 'DATE_REFERENCE',
        value: dateMatch[0],
        position: dateMatch.index,
        confidence: 0.9,
      });
    }

    return {
      entities,
      count: entities.length,
      types: [...new Set(entities.map(e => e.type))],
    };
  }
}
