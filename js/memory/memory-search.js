// MCP Arena — Memory Search
// Intelligent retrieval across facts with temporal weighting,
// keyword matching, and context-aware ranking

export class MemorySearch {
  constructor(factStore) {
    this.factStore = factStore;
  }

  /**
   * Smart search: combines keyword, recency, confidence, and relevance
   * @param {string} userId
   * @param {string} query — natural language search query
   * @param {Object} options — { limit, recencyBias, types, includeExpired }
   * @returns {Array} Ranked facts
   */
  async search(userId, query, options = {}) {
    const {
      limit = 20,
      recencyBias = 0.3,    // 0 = pure relevance, 1 = pure recency
      types = null,          // filter to specific fact types
      includeExpired = false,
    } = options;

    // Get all facts for user
    let allFacts = await this.factStore.retrieveFacts({
      userId,
      type: types && types.length === 1 ? types[0] : undefined,
      limit: 500,
    });

    if (types && types.length > 1) {
      allFacts = allFacts.filter(f => types.includes(f.type));
    }

    if (!includeExpired) {
      const now = Date.now();
      allFacts = allFacts.filter(f => !f.expiresAt || f.expiresAt > now);
    }

    if (!query || query.trim() === '') {
      // No query — return by recency + confidence
      return allFacts.slice(0, limit);
    }

    // Score each fact
    const queryTokens = this._tokenize(query);
    const scored = allFacts.map(fact => {
      const relevance = this._computeRelevance(fact, queryTokens);
      const recency = this._computeRecency(fact);
      const confidence = fact.confidence || 0.5;

      // Composite score
      const score = (
        relevance * (1 - recencyBias) * 0.5 +
        recency * recencyBias * 0.3 +
        confidence * 0.2
      );

      return { fact, score, relevance, recency };
    });

    // Sort by composite score
    scored.sort((a, b) => b.score - a.score);

    return scored
      .filter(s => s.score > 0.01) // drop zero-relevance unless recency saves it
      .slice(0, limit)
      .map(s => ({
        ...s.fact,
        _searchScore: Math.round(s.score * 1000) / 1000,
        _relevance: Math.round(s.relevance * 1000) / 1000,
        _recency: Math.round(s.recency * 1000) / 1000,
      }));
  }

  /**
   * Context-aware retrieval for a conversation turn
   * Given the current user message + recent emotions, find the most relevant facts
   */
  async getContextForTurn(userId, userMessage, recentEmotions = []) {
    const results = {
      profile: [],
      relevant: [],
      emotional: [],
      recent: [],
    };

    // 1. Always load core profile facts (personal, health)
    results.profile = await this.factStore.retrieveFacts({
      userId,
      type: 'personal',
      limit: 10,
    });
    const healthFacts = await this.factStore.retrieveFacts({
      userId,
      type: 'health',
      limit: 5,
    });
    results.profile.push(...healthFacts);

    // 2. Search for message-relevant facts
    results.relevant = await this.search(userId, userMessage, {
      limit: 10,
      recencyBias: 0.2,
    });

    // 3. Get emotional context if user seems emotional
    const emotionalKeywords = ['sad', 'lonely', 'happy', 'angry', 'scared', 'worried',
      '唔開心', '孤獨', '開心', '嬲', '驚', '擔心', '難過'];
    const msgLower = userMessage.toLowerCase();
    const isEmotional = emotionalKeywords.some(kw => msgLower.includes(kw));

    if (isEmotional || recentEmotions.length > 0) {
      results.emotional = await this.factStore.retrieveFacts({
        userId,
        type: 'emotional',
        limit: 5,
      });
    }

    // 4. Get most recent facts (last 24h) for temporal context
    results.recent = await this.factStore.retrieveFacts({
      userId,
      since: Date.now() - 24 * 60 * 60 * 1000,
      limit: 5,
    });

    // Deduplicate across categories
    const seen = new Set();
    const dedup = (arr) => arr.filter(f => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });

    return {
      profile: dedup(results.profile),
      relevant: dedup(results.relevant),
      emotional: dedup(results.emotional),
      recent: dedup(results.recent),
      totalFactsUsed: seen.size,
    };
  }

  /**
   * Extract potential facts from a conversation turn
   * Returns fact candidates that the brain should consider storing
   */
  extractFactCandidates(userMessage, botResponse, detectedEmotion) {
    const candidates = [];
    const msg = userMessage.toLowerCase();

    // Personal info patterns
    const personalPatterns = [
      { regex: /my name is (\w+)/i, type: 'personal', tag: 'name' },
      { regex: /i(?:'m| am) (\d+) years? old/i, type: 'personal', tag: 'age' },
      { regex: /我叫(.{1,8})/i, type: 'personal', tag: 'name' },
      { regex: /我(\d+)歲/i, type: 'personal', tag: 'age' },
      { regex: /i live (?:in|at|near) (.+?)(?:\.|$)/i, type: 'personal', tag: 'location' },
      { regex: /我住(?:喺|在)(.+?)(?:。|$)/i, type: 'personal', tag: 'location' },
    ];

    // Family patterns
    const familyPatterns = [
      { regex: /my (son|daughter|husband|wife|brother|sister|grandchild)/i, type: 'social', tag: 'family' },
      { regex: /我(?:個|嘅)(仔|女|老公|老婆|孫)/i, type: 'social', tag: 'family' },
    ];

    // Preference patterns
    const prefPatterns = [
      { regex: /i (?:like|love|enjoy|prefer) (.+?)(?:\.|$)/i, type: 'preference', tag: 'likes' },
      { regex: /i (?:don'?t like|hate|dislike) (.+?)(?:\.|$)/i, type: 'preference', tag: 'dislikes' },
      { regex: /我(?:鍾意|喜歡)(.+?)(?:。|$)/i, type: 'preference', tag: 'likes' },
      { regex: /我(?:唔鍾意|唔喜歡)(.+?)(?:。|$)/i, type: 'preference', tag: 'dislikes' },
    ];

    // Health patterns
    const healthPatterns = [
      { regex: /i have (diabetes|arthritis|dementia|alzheimer|hypertension|heart|pain)/i, type: 'health', tag: 'condition' },
      { regex: /i take (.+?) (?:medication|medicine|pill)/i, type: 'health', tag: 'medication' },
      { regex: /我有(.+?)(?:病|症)/i, type: 'health', tag: 'condition' },
    ];

    const allPatterns = [...personalPatterns, ...familyPatterns, ...prefPatterns, ...healthPatterns];

    for (const { regex, type, tag } of allPatterns) {
      const match = userMessage.match(regex);
      if (match) {
        candidates.push({
          type,
          content: match[0],
          tags: [tag],
          confidence: 0.85,
          source: 'user_stated',
        });
      }
    }

    // Emotional fact from detected emotion
    if (detectedEmotion && detectedEmotion.emotion) {
      candidates.push({
        type: 'emotional',
        content: detectedEmotion.emotion,
        tags: ['detected'],
        confidence: detectedEmotion.intensity || 0.6,
        source: 'observation',
        emotionalValence: this._emotionToValence(detectedEmotion.emotion),
      });
    }

    return candidates;
  }

  // ═══════════════════════════════════════════
  // INTERNAL SCORING
  // ═══════════════════════════════════════════

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  _computeRelevance(fact, queryTokens) {
    if (queryTokens.length === 0) return 0;
    const factTokens = new Set(this._tokenize(fact.content));
    const tagTokens = new Set(fact.tags.map(t => t.toLowerCase()));
    const typeToken = fact.type.toLowerCase();

    let matches = 0;
    for (const qt of queryTokens) {
      if (factTokens.has(qt)) matches += 1;
      else if (tagTokens.has(qt)) matches += 0.8;
      else if (typeToken.includes(qt)) matches += 0.5;
      else {
        // Partial match (substring)
        for (const ft of factTokens) {
          if (ft.includes(qt) || qt.includes(ft)) {
            matches += 0.4;
            break;
          }
        }
      }
    }
    return Math.min(1, matches / queryTokens.length);
  }

  _computeRecency(fact) {
    const age = Date.now() - (fact.updatedAt || fact.createdAt);
    const hourMs = 60 * 60 * 1000;
    if (age < hourMs) return 1.0;           // Last hour
    if (age < 24 * hourMs) return 0.8;      // Last day
    if (age < 7 * 24 * hourMs) return 0.5;  // Last week
    if (age < 30 * 24 * hourMs) return 0.3; // Last month
    return 0.1;                              // Older
  }

  _emotionToValence(emotion) {
    const positive = ['joy', 'gratitude', 'excitement', 'contentment', 'amusement', 'love'];
    const negative = ['sadness', 'anger', 'fear', 'loneliness', 'frustration', 'grief', 'anxiety'];
    const e = emotion.toLowerCase();
    if (positive.includes(e)) return 'positive';
    if (negative.includes(e)) return 'negative';
    return 'neutral';
  }
}
