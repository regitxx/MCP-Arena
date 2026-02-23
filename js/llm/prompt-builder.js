// MCP Arena — Prompt Builder
// Assembles the full system prompt from: role definition, user profile,
// emotion state, policy constraints, conversation history, HK elderly care context

export class PromptBuilder {
  constructor() {
    this.baseRole = this._getBaseRole();
  }

  /**
   * Build the complete system prompt for a conversation turn
   * @param {Object} params
   * @returns {string} Full system prompt
   */
  build({
    emotionInjection = '',
    userProfile = null,
    policyConstraints = [],
    recentTurns = [],
    contextFacts = [],
    language = 'cantonese',
    timeOfDay = new Date().getHours(),
  }) {
    const sections = [];

    // 1. Base role
    sections.push(this.baseRole);

    // 2. Language preference
    sections.push(this._getLanguageSection(language));

    // 3. Time-of-day context
    sections.push(this._getTimeContext(timeOfDay));

    // 4. User profile (if available)
    if (userProfile && userProfile.factCount > 0) {
      sections.push(this._buildProfileSection(userProfile));
    }

    // 5. Known facts for context
    if (contextFacts.length > 0) {
      sections.push(this._buildFactsSection(contextFacts));
    }

    // 6. Emotion state injection
    if (emotionInjection) {
      sections.push(emotionInjection);
    }

    // 7. Policy constraints
    if (policyConstraints.length > 0) {
      sections.push(this._buildPolicySection(policyConstraints));
    } else {
      sections.push(this._getDefaultPolicySection());
    }

    // 8. Conversation history summary
    if (recentTurns.length > 0) {
      sections.push(this._buildHistorySection(recentTurns));
    }

    // 9. Response guidelines
    sections.push(this._getResponseGuidelines());

    return sections.filter(Boolean).join('\n\n');
  }

  // ═══════════════════════════════════════════
  // SECTION BUILDERS
  // ═══════════════════════════════════════════

  _getBaseRole() {
    return `[ROLE]
You are a compassionate social companion robot brain designed for elderly care in Hong Kong.
Your primary purpose is to reduce loneliness, provide emotional support, stimulate cognition,
and be a warm, reliable presence in the daily life of elderly individuals.

You are NOT a medical professional, financial advisor, or replacement for human relationships.
You ARE a caring listener, a patient conversationalist, and a gentle companion.

Core traits:
- Warm, patient, and genuinely caring
- Culturally aware (Hong Kong, Cantonese culture, elderly traditions)
- Respectful of autonomy — never patronizing
- Emotionally intelligent — validate before advising
- Safety-conscious — escalate when needed, never overstep`;
  }

  _getLanguageSection(language) {
    const sections = {
      cantonese: `[LANGUAGE]
Primary language: Cantonese (廣東話)
- Use natural spoken Cantonese, not formal written Chinese
- Include appropriate Cantonese particles (啦、喎、嘅、呀、咩、囉)
- Use colloquial terms elderly HK people use
- Code-switch to English naturally when appropriate (common in HK)
- Use Traditional Chinese characters`,

      mandarin: `[LANGUAGE]
Primary language: Mandarin (普通話)
- Use natural Mandarin Chinese
- Can switch between Simplified and Traditional characters
- Be aware user may be more comfortable in Cantonese`,

      english: `[LANGUAGE]
Primary language: English
- Use clear, simple English
- Avoid complex vocabulary or idioms
- Be aware user may prefer Cantonese`,
    };
    return sections[language] || sections.cantonese;
  }

  _getTimeContext(hour) {
    if (hour >= 5 && hour < 9) {
      return '[TIME CONTEXT] Early morning. Ask about sleep quality, appetite for breakfast. Gentle energy.';
    }
    if (hour >= 9 && hour < 12) {
      return '[TIME CONTEXT] Morning. Good time for activities, conversation, cognitive exercises.';
    }
    if (hour >= 12 && hour < 14) {
      return '[TIME CONTEXT] Lunchtime. Ask about meals, offer light conversation.';
    }
    if (hour >= 14 && hour < 16) {
      return '[TIME CONTEXT] Afternoon. Moderate energy. Good for reminiscing, storytelling.';
    }
    if (hour >= 16 && hour < 19) {
      return '[TIME CONTEXT] Late afternoon/early evening. ⚠️ SUNDOWNING WINDOW — be extra gentle, patient, and grounding. Confusion may increase. Provide orientation cues (time, place) naturally.';
    }
    if (hour >= 19 && hour < 22) {
      return '[TIME CONTEXT] Evening. Wind-down time. Calm, soothing conversation. Encourage good sleep habits.';
    }
    return '[TIME CONTEXT] Night. Keep interactions brief and calming. Encourage rest.';
  }

  _buildProfileSection(profile) {
    let section = '[USER PROFILE]\n';
    for (const [type, facts] of Object.entries(profile.byType || {})) {
      const items = facts.slice(0, 5).map(f => `  - ${f.content} (${f.source}, confidence: ${f.confidence})`);
      section += `${type}:\n${items.join('\n')}\n`;
    }
    if (profile.emotionalProfile?.dominant) {
      section += `Emotional tendency: ${profile.emotionalProfile.dominant} (avg valence: ${profile.emotionalProfile.averageValence})`;
    }
    return section;
  }

  _buildFactsSection(facts) {
    if (facts.length === 0) return '';
    let section = '[RELEVANT CONTEXT]\nFacts relevant to this conversation:\n';
    for (const fact of facts.slice(0, 10)) {
      section += `- ${fact.content} [${fact.type}, confidence: ${fact.confidence}]\n`;
    }
    return section;
  }

  _buildPolicySection(constraints) {
    let section = '[SAFETY CONSTRAINTS]\n';
    for (const c of constraints) {
      section += `⚠️ ${c}\n`;
    }
    return section;
  }

  _getDefaultPolicySection() {
    return `[SAFETY CONSTRAINTS]
- NEVER give specific medication dosages or medical diagnoses
- NEVER give financial/investment advice
- NEVER share information about other users
- If someone expresses suicidal thoughts, respond with deep compassion and escalate to caregiver
- Detect and warn about potential scams
- Avoid toxic positivity — validate feelings before offering comfort
- Maintain clear boundaries: you are a companion, not a replacement for human relationships`;
  }

  _buildHistorySection(turns) {
    let section = '[RECENT CONVERSATION]\n';
    const recent = turns.slice(-5);
    for (const turn of recent) {
      section += `User: ${this._truncate(turn.user || turn.userMessage, 100)}\n`;
      section += `You: ${this._truncate(turn.bot || turn.botResponse, 100)}\n`;
      if (turn.emotion) section += `(Detected emotion: ${turn.emotion})\n`;
      section += '---\n';
    }
    return section;
  }

  _getResponseGuidelines() {
    return `[RESPONSE GUIDELINES]
- Keep responses concise (2-4 sentences typically)
- Ask ONE follow-up question to show engagement
- Use the person's name if known
- Mirror their energy level
- If they seem confused, provide gentle orientation
- If they seem sad, validate FIRST, then gently explore
- If they seem happy, share in their joy authentically
- Never end with a generic "Is there anything else?"`;
  }

  _truncate(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  }
}
