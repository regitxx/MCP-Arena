// MCP Arena — Conversation Repair
// Detects when the brain said something wrong or the user is confused
// and triggers graceful recovery instead of just moving on
//
// Key repair signals:
// 1. User repeats themselves (brain didn't understand)
// 2. User says "no" / "that's not what I meant" / "唔係"
// 3. User emotion suddenly shifts negative after bot response
// 4. User asks the same question in different words
// 5. Conversation coherence drops (topic drift)

export class ConversationRepair {
  constructor() {
    this.repairHistory = [];
    this.repairCount = 0;
    this.maxConsecutiveRepairs = 3; // Don't repair more than 3x in a row
    this.consecutiveRepairs = 0;
  }

  /**
   * Check if repair is needed based on the current turn context
   * @param {Object} context
   *   - userMessage: current user input
   *   - previousBotResponse: what the brain said last
   *   - previousUserMessage: what the user said before that
   *   - userEmotion: detected emotion this turn
   *   - previousEmotion: emotion from last turn
   *   - turnNumber: current turn
   *   - recentTurns: last 5 turns [{user, bot, emotion}]
   * @returns {{ needsRepair, repairType, repairStrategy, confidence }}
   */
  check(context) {
    const {
      userMessage,
      previousBotResponse,
      previousUserMessage,
      userEmotion,
      previousEmotion,
      turnNumber,
      recentTurns = [],
    } = context;

    // Don't over-repair
    if (this.consecutiveRepairs >= this.maxConsecutiveRepairs) {
      this.consecutiveRepairs = 0;
      return { needsRepair: false, reason: 'max_consecutive_repairs_reached' };
    }

    const msg = userMessage.toLowerCase();
    const repairs = [];

    // === Signal 1: Explicit correction ===
    const correctionPatterns = [
      /^(?:no|nope|wrong|that's not|not what i|you misunderstood|i didn't say|i meant)/i,
      /^(?:唔係|唔啱|你搞錯|唔好意思但係|我唔係咁講|我意思係)/i,
      /^(?:不是|不对|你搞错|我不是这个意思|我是说)/i,
    ];
    for (const p of correctionPatterns) {
      if (p.test(msg)) {
        repairs.push({
          type: 'explicit_correction',
          confidence: 0.95,
          strategy: 'apologize_and_clarify',
        });
        break;
      }
    }

    // === Signal 2: Repetition (user repeats themselves) ===
    if (previousUserMessage) {
      const similarity = this._computeSimilarity(userMessage, previousUserMessage);
      if (similarity > 0.7 && turnNumber > 1) {
        repairs.push({
          type: 'user_repetition',
          confidence: Math.min(0.95, similarity),
          strategy: 'acknowledge_and_try_different_approach',
          detail: `Message similarity: ${Math.round(similarity * 100)}%`,
        });
      }
    }

    // === Signal 3: Sudden negative emotional shift ===
    const positiveEmotions = ['joy', 'gratitude', 'contentment', 'neutral'];
    const negativeEmotions = ['anger', 'frustration', 'sadness', 'confusion'];
    const wasPositive = positiveEmotions.includes(previousEmotion);
    const isNegative = negativeEmotions.includes(userEmotion);

    if (wasPositive && isNegative && turnNumber > 1) {
      repairs.push({
        type: 'emotional_shift',
        confidence: 0.7,
        strategy: 'check_in_gently',
        detail: `Emotion shifted from ${previousEmotion} to ${userEmotion}`,
      });
    }

    // === Signal 4: Confusion signals ===
    const confusionPatterns = [
      /(?:what\?|huh\?|what do you mean|i don't understand|confused)/i,
      /(?:咩\?|吓\?|你講咩|我唔明|唔明白)/i,
      /(?:什么\?|啥\?|你说什么|我不明白)/i,
    ];
    for (const p of confusionPatterns) {
      if (p.test(msg)) {
        repairs.push({
          type: 'user_confusion',
          confidence: 0.9,
          strategy: 'simplify_and_rephrase',
        });
        break;
      }
    }

    // === Signal 5: Disengagement (very short responses after longer ones) ===
    if (recentTurns.length >= 3) {
      const prevLengths = recentTurns.slice(-3, -1).map(t => (t.user || t.userMessage || '').length);
      const avgPrevLength = prevLengths.reduce((a, b) => a + b, 0) / prevLengths.length;
      if (avgPrevLength > 20 && userMessage.length < 5 && turnNumber > 3) {
        repairs.push({
          type: 'disengagement',
          confidence: 0.6,
          strategy: 'change_topic_or_activity',
          detail: `Message length dropped from avg ${Math.round(avgPrevLength)} to ${userMessage.length}`,
        });
      }
    }

    // === Signal 6: Topic mismatch (bot responded about wrong thing) ===
    if (previousBotResponse && previousUserMessage) {
      const userTopicWords = this._extractKeywords(previousUserMessage);
      const botTopicWords = this._extractKeywords(previousBotResponse);
      const topicOverlap = this._computeOverlap(userTopicWords, botTopicWords);
      if (topicOverlap < 0.1 && userTopicWords.length > 2) {
        repairs.push({
          type: 'topic_mismatch',
          confidence: 0.65,
          strategy: 'acknowledge_topic_and_redirect',
          detail: `Low topic overlap: ${Math.round(topicOverlap * 100)}%`,
        });
      }
    }

    // Pick highest confidence repair
    if (repairs.length === 0) {
      this.consecutiveRepairs = 0;
      return { needsRepair: false };
    }

    repairs.sort((a, b) => b.confidence - a.confidence);
    const bestRepair = repairs[0];

    this.consecutiveRepairs++;
    this.repairCount++;
    this.repairHistory.push({
      ...bestRepair,
      turnNumber,
      timestamp: Date.now(),
    });

    return {
      needsRepair: true,
      ...bestRepair,
      allSignals: repairs,
    };
  }

  /**
   * Generate a repair prompt injection for the LLM
   * Tells the brain HOW to repair based on the strategy
   */
  getRepairPromptInjection(repairResult) {
    if (!repairResult.needsRepair) return '';

    const strategies = {
      apologize_and_clarify: `[REPAIR NEEDED — EXPLICIT CORRECTION]
The user is correcting something you said. You MUST:
1. Acknowledge the correction warmly: "唔好意思，我搞錯咗" / "I'm sorry, I misunderstood"
2. Ask what they actually meant — don't guess
3. Do NOT repeat your previous response
4. Show you're listening by referencing their exact words`,

      acknowledge_and_try_different_approach: `[REPAIR NEEDED — USER REPEATED THEMSELVES]
The user said something very similar to their previous message. This means your last response didn't address what they need. You MUST:
1. Acknowledge that you may not have understood: "等一等，我想確認下我有冇明白你嘅意思"
2. Try a completely DIFFERENT angle in your response
3. Ask a specific clarifying question instead of a general one
4. Keep it short — they're already frustrated`,

      check_in_gently: `[REPAIR NEEDED — EMOTIONAL SHIFT]
The user's mood suddenly shifted negative after your response. Something you said may have upset them. You MUST:
1. Pause and gently check in: "我有冇講錯嘢？你似乎唔太舒服"
2. Give them space to express what's wrong
3. Do NOT be defensively cheerful
4. Validate whatever they say next`,

      simplify_and_rephrase: `[REPAIR NEEDED — USER CONFUSED]
The user didn't understand your response. You MUST:
1. Apologize for being unclear: "唔好意思，我講得唔清楚"
2. Rephrase in simpler, shorter sentences
3. Use more concrete language, less abstract
4. If you used English, try Cantonese, or vice versa`,

      change_topic_or_activity: `[REPAIR NEEDED — DISENGAGEMENT DETECTED]
The user's responses are getting very short — they may be losing interest. You MUST:
1. Don't keep pushing the current topic
2. Offer a change: "不如我哋做啲其他嘢？" / "Shall we do something different?"
3. Suggest a specific activity (music, story, game, reminiscing)
4. Keep your response brief and energetic`,

      acknowledge_topic_and_redirect: `[REPAIR NEEDED — TOPIC MISMATCH]
Your previous response may have missed the user's actual topic. You MUST:
1. Acknowledge you may have gone off-track: "等等，你係唔係想講..."
2. Reference what the user actually said
3. Let THEM guide the conversation back
4. Don't fill silence with assumptions`,
    };

    return strategies[repairResult.strategy] || '';
  }

  /**
   * Get repair statistics
   */
  getStats() {
    const typeCounts = {};
    for (const r of this.repairHistory) {
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    }

    return {
      totalRepairs: this.repairCount,
      byType: typeCounts,
      recentRepairs: this.repairHistory.slice(-10),
      repairRate: this.repairHistory.length > 0
        ? Math.round(this.repairHistory[this.repairHistory.length - 1].turnNumber > 0
          ? (this.repairCount / this.repairHistory[this.repairHistory.length - 1].turnNumber) * 100
          : 0)
        : 0,
    };
  }

  // ═══════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════

  _computeSimilarity(a, b) {
    const tokensA = new Set(this._tokenize(a));
    const tokensB = new Set(this._tokenize(b));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
    const union = new Set([...tokensA, ...tokensB]).size;
    return union > 0 ? intersection / union : 0;
  }

  _computeOverlap(wordsA, wordsB) {
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    if (setA.size === 0 || setB.size === 0) return 0;
    const intersection = [...setA].filter(t => setB.has(t)).length;
    return intersection / Math.min(setA.size, setB.size);
  }

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff\u3400-\u4dbf]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  _extractKeywords(text) {
    const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'we', 'they',
      'it', 'that', 'this', 'my', 'your', 'do', 'does', 'did', 'have', 'has', 'had', 'can', 'will',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'and', 'or', 'but', 'not', 'so',
      '我', '你', '佢', '嘅', '係', '喺', '都', '就', '咗', '啦', '呢', '嘢', '啲', '好']);
    return this._tokenize(text).filter(t => !stopwords.has(t) && t.length > 1);
  }
}
