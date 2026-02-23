// MCP Arena — Context Loader
// Assembles everything the brain needs for one conversation turn:
// recent history, user profile, emotion timeline, current time/context

export class ContextLoader {
  constructor(memoryServer) {
    this.memory = memoryServer;
  }

  /**
   * Load full context for a conversation turn
   * @param {string} userId
   * @param {string} userMessage — current user input
   * @returns {Object} Complete context bundle
   */
  async loadForTurn(userId, userMessage) {
    // Fire all memory queries in parallel
    const [contextResult, profileResult, recentTurnsResult, emotionTimelineResult] = await Promise.all([
      this.memory.executeTool('get_context_for_turn', { userId, userMessage }),
      this.memory.executeTool('get_profile', { userId }),
      this.memory.executeTool('get_recent_turns', { userId, limit: 5 }),
      this.memory.executeTool('get_emotion_timeline', { userId, days: 1 }),
    ]);

    // Compile context facts (deduped across all sources)
    const allFacts = [];
    const seenIds = new Set();
    const addFacts = (facts) => {
      for (const f of (facts || [])) {
        if (!seenIds.has(f.id)) {
          seenIds.add(f.id);
          allFacts.push(f);
        }
      }
    };
    addFacts(contextResult.profile);
    addFacts(contextResult.relevant);
    addFacts(contextResult.emotional);
    addFacts(contextResult.recent);

    // Get time context
    const now = new Date();
    const timeContext = {
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayOfWeek: now.toLocaleDateString('en', { weekday: 'long' }),
      isSundowningWindow: now.getHours() >= 16 && now.getHours() <= 21,
      isNightTime: now.getHours() >= 22 || now.getHours() < 6,
      isMorning: now.getHours() >= 6 && now.getHours() < 12,
    };

    // Detect conversation patterns
    const recentTurns = recentTurnsResult.turns || [];
    const patterns = this._detectPatterns(recentTurns);

    return {
      userId,
      userMessage,
      profile: profileResult,
      contextFacts: allFacts,
      recentTurns,
      emotionTimeline: emotionTimelineResult.timeline || [],
      emotionSummary: emotionTimelineResult.summary || {},
      timeContext,
      patterns,
      totalFactsAvailable: contextResult.totalFactsUsed || 0,
    };
  }

  /**
   * Detect conversation patterns from recent turns
   */
  _detectPatterns(turns) {
    const patterns = {
      repetition: false,
      emotionalEscalation: false,
      disengagement: false,
      confusion: false,
      topicPersistence: null,
    };

    if (turns.length < 2) return patterns;

    // Check for repetition (user saying same thing)
    const userMsgs = turns.map(t => (t.user || t.userMessage || '').toLowerCase());
    for (let i = 1; i < userMsgs.length; i++) {
      if (userMsgs[i] && userMsgs[i] === userMsgs[i - 1]) {
        patterns.repetition = true;
        break;
      }
    }

    // Check for emotional escalation
    const emotions = turns
      .map(t => t.emotion)
      .filter(Boolean);
    const negativeEmotions = ['sadness', 'anger', 'fear', 'anxiety', 'loneliness', 'grief'];
    const recentNegative = emotions.slice(-3).filter(e => negativeEmotions.includes(e)).length;
    if (recentNegative >= 2) patterns.emotionalEscalation = true;

    // Check for disengagement (very short responses)
    const recentUserLengths = turns.slice(-3).map(t => (t.user || t.userMessage || '').length);
    if (recentUserLengths.every(l => l < 10)) patterns.disengagement = true;

    // Check for confusion patterns
    const confusionWords = /where am i|who are you|what time|我喺邊|你係邊個|幾點/i;
    const recentConfusion = turns.slice(-3).filter(t =>
      confusionWords.test(t.user || t.userMessage || '')
    ).length;
    if (recentConfusion >= 2) patterns.confusion = true;

    return patterns;
  }
}
