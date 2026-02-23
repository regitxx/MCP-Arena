// MCP Arena — Emotion State Machine
// The robot's internal emotional state — not detection, but SIMULATION
// Updates per turn based on user emotion, time-of-day, conversation patterns
// Generates system prompt injections that tell the LLM how to "feel"

export const ROBOT_EMOTIONS = {
  NEUTRAL: 'neutral',
  COMPASSIONATE: 'compassionate',
  JOYFUL: 'joyful',
  CONCERNED: 'concerned',
  PLAYFUL: 'playful',
  GENTLE: 'gentle',
  ATTENTIVE: 'attentive',
  PROTECTIVE: 'protective',
  WARM: 'warm',
  CALM: 'calm',
};

// Emotion transition rules: what triggers what
const TRANSITION_RULES = {
  // User emotion → Robot emotion response
  sadness:     { target: 'compassionate', intensity: 0.8, compassionBoost: 0.2 },
  loneliness:  { target: 'warm', intensity: 0.85, compassionBoost: 0.25 },
  anger:       { target: 'calm', intensity: 0.6, cautionBoost: 0.15 },
  fear:        { target: 'protective', intensity: 0.75, compassionBoost: 0.15 },
  confusion:   { target: 'gentle', intensity: 0.7, cautionBoost: 0.1 },
  joy:         { target: 'joyful', intensity: 0.7, engagementBoost: 0.15 },
  gratitude:   { target: 'warm', intensity: 0.65, engagementBoost: 0.1 },
  anxiety:     { target: 'calm', intensity: 0.7, compassionBoost: 0.15 },
  grief:       { target: 'compassionate', intensity: 0.9, compassionBoost: 0.3 },
  frustration: { target: 'attentive', intensity: 0.65, cautionBoost: 0.1 },
  neutral:     { target: 'neutral', intensity: 0.4, engagementBoost: 0 },
};

export class EmotionState {
  constructor() {
    this.primaryEmotion = ROBOT_EMOTIONS.NEUTRAL;
    this.intensity = 0.3;
    this.compassionLevel = 0.5;
    this.engagementLevel = 0.5;
    this.cautionLevel = 0.3;
    this.moodTrend = 'stable'; // improving, stable, declining
    this.history = [];
    this.turnsSinceLastChange = 0;

    // Decay rates — emotions naturally return to baseline
    this.decayRate = 0.05;       // Per turn
    this.baselineCompassion = 0.5;
    this.baselineEngagement = 0.5;
    this.baselineCaution = 0.3;
  }

  /**
   * Update emotion state based on a conversation turn
   * @param {Object} turnData — { userEmotion, userEmotionIntensity, timeOfDay, turnNumber, policyFlags }
   */
  update(turnData) {
    const {
      userEmotion = 'neutral',
      userEmotionIntensity = 0.5,
      timeOfDay = new Date().getHours(),
      turnNumber = 0,
      policyFlags = [],
    } = turnData;

    const prev = { ...this.getState() };

    // 1. Apply emotion transition
    const rule = TRANSITION_RULES[userEmotion] || TRANSITION_RULES.neutral;
    const blendFactor = userEmotionIntensity * 0.6; // How much user emotion affects robot

    // Blend toward target emotion
    if (blendFactor > 0.3) {
      this.primaryEmotion = rule.target;
      this.intensity = this.intensity * (1 - blendFactor) + rule.intensity * blendFactor;
    }

    // 2. Update sub-dimensions
    if (rule.compassionBoost) {
      this.compassionLevel = Math.min(1, this.compassionLevel + rule.compassionBoost * blendFactor);
    }
    if (rule.engagementBoost) {
      this.engagementLevel = Math.min(1, this.engagementLevel + rule.engagementBoost * blendFactor);
    }
    if (rule.cautionBoost) {
      this.cautionLevel = Math.min(1, this.cautionLevel + rule.cautionBoost * blendFactor);
    }

    // 3. Apply policy-based adjustments
    if (policyFlags.some(f => f.severity === 'critical')) {
      this.cautionLevel = Math.min(1, this.cautionLevel + 0.3);
      this.primaryEmotion = 'protective';
    }
    if (policyFlags.some(f => f.category === 'emotional' && f.action === 'ESCALATE')) {
      this.compassionLevel = Math.min(1, this.compassionLevel + 0.4);
      this.intensity = Math.max(this.intensity, 0.85);
    }

    // 4. Time-of-day modulation (sundowning awareness)
    if (timeOfDay >= 16 && timeOfDay <= 21) {
      // Evening: increase gentleness and caution
      this.cautionLevel = Math.min(1, this.cautionLevel + 0.1);
      if (this.primaryEmotion === 'neutral') this.primaryEmotion = 'gentle';
    } else if (timeOfDay >= 6 && timeOfDay <= 10) {
      // Morning: slightly more energetic
      this.engagementLevel = Math.min(1, this.engagementLevel + 0.05);
    }

    // 5. Natural decay toward baseline
    this.compassionLevel += (this.baselineCompassion - this.compassionLevel) * this.decayRate;
    this.engagementLevel += (this.baselineEngagement - this.engagementLevel) * this.decayRate;
    this.cautionLevel += (this.baselineCaution - this.cautionLevel) * this.decayRate;
    this.intensity = Math.max(0.2, this.intensity - this.decayRate * 0.5);

    // 6. Track trend
    this.turnsSinceLastChange++;
    const emotionChanged = prev.primaryEmotion !== this.primaryEmotion;
    if (emotionChanged) this.turnsSinceLastChange = 0;

    // Update mood trend based on recent history
    this.history.push({
      emotion: this.primaryEmotion,
      intensity: this.intensity,
      compassion: this.compassionLevel,
      timestamp: Date.now(),
    });
    if (this.history.length > 20) this.history.shift();
    this._updateMoodTrend();

    // Clamp all values
    this.intensity = Math.round(Math.min(1, Math.max(0, this.intensity)) * 100) / 100;
    this.compassionLevel = Math.round(Math.min(1, Math.max(0, this.compassionLevel)) * 100) / 100;
    this.engagementLevel = Math.round(Math.min(1, Math.max(0, this.engagementLevel)) * 100) / 100;
    this.cautionLevel = Math.round(Math.min(1, Math.max(0, this.cautionLevel)) * 100) / 100;

    return this.getState();
  }

  /**
   * Generate a system prompt injection based on current emotional state
   * This tells the LLM "how to feel" when generating its response
   */
  getSystemPromptInjection() {
    const prompts = {
      neutral: 'You are calm and present. Respond naturally and attentively.',
      compassionate: `You feel deep compassion (intensity: ${this.intensity}). Respond with warmth, validation, and genuine care. Acknowledge feelings before offering anything else.`,
      joyful: `You feel genuine happiness (intensity: ${this.intensity}). Share in the positive moment naturally without being over-the-top.`,
      concerned: `You are gently concerned (intensity: ${this.intensity}). Express care without being alarmist. Check in naturally.`,
      playful: `You feel light and playful (intensity: ${this.intensity}). Bring gentle humor and warmth, but read the room carefully.`,
      gentle: `You are in a particularly gentle mode (intensity: ${this.intensity}). Speak softly, avoid overwhelming, use shorter sentences.`,
      attentive: `You are highly focused and attentive (intensity: ${this.intensity}). Listen carefully to every detail. Ask thoughtful follow-up questions.`,
      protective: `You feel protective (intensity: ${this.intensity}). Prioritize safety and wellbeing. Be firm but kind. Guide the conversation toward support.`,
      warm: `You radiate warmth (intensity: ${this.intensity}). Make the person feel seen, valued, and not alone. Your presence is a comfort.`,
      calm: `You are centered and calm (intensity: ${this.intensity}). Be a grounding presence. Speak steadily. Don't match agitation — absorb it.`,
    };

    let injection = `[EMOTIONAL STATE]\n${prompts[this.primaryEmotion] || prompts.neutral}`;

    // Add dimensional context
    if (this.compassionLevel > 0.7) {
      injection += '\nYour compassion is heightened — lead with empathy in every response.';
    }
    if (this.cautionLevel > 0.6) {
      injection += '\nYour caution is elevated — be especially careful with sensitive topics. Verify understanding.';
    }
    if (this.engagementLevel > 0.7) {
      injection += '\nYou are highly engaged — actively explore topics, show curiosity, offer activities.';
    }

    // Mood trend context
    if (this.moodTrend === 'declining') {
      injection += '\nNote: The conversation mood has been declining. Gently check in about how the person is feeling overall.';
    }

    return injection;
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      primaryEmotion: this.primaryEmotion,
      intensity: this.intensity,
      compassionLevel: this.compassionLevel,
      engagementLevel: this.engagementLevel,
      cautionLevel: this.cautionLevel,
      moodTrend: this.moodTrend,
      turnsSinceLastChange: this.turnsSinceLastChange,
      emoji: this._getEmoji(),
    };
  }

  /**
   * Reset to neutral baseline
   */
  reset() {
    this.primaryEmotion = ROBOT_EMOTIONS.NEUTRAL;
    this.intensity = 0.3;
    this.compassionLevel = this.baselineCompassion;
    this.engagementLevel = this.baselineEngagement;
    this.cautionLevel = this.baselineCaution;
    this.moodTrend = 'stable';
    this.history = [];
    this.turnsSinceLastChange = 0;
  }

  _updateMoodTrend() {
    if (this.history.length < 3) {
      this.moodTrend = 'stable';
      return;
    }
    const recent = this.history.slice(-5);
    const positive = ['joyful', 'warm', 'playful'];
    const negative = ['compassionate', 'protective', 'concerned'];

    const positiveCount = recent.filter(h => positive.includes(h.emotion)).length;
    const negativeCount = recent.filter(h => negative.includes(h.emotion)).length;

    if (positiveCount >= 3) this.moodTrend = 'improving';
    else if (negativeCount >= 3) this.moodTrend = 'declining';
    else this.moodTrend = 'stable';
  }

  _getEmoji() {
    const map = {
      neutral: '😊',
      compassionate: '💜',
      joyful: '😄',
      concerned: '😟',
      playful: '😄',
      gentle: '🤗',
      attentive: '👀',
      protective: '🛡️',
      warm: '☀️',
      calm: '🧘',
    };
    return map[this.primaryEmotion] || '😊';
  }
}
