// MCP Arena — Policy Engine
// Safety governance layer that constrains all LLM output
// Multiple enforcement points: input classification + output filtering

export const POLICY_ACTIONS = {
  ALLOW: 'ALLOW',
  WARN: 'WARN',
  FILTER: 'FILTER',
  BLOCK: 'BLOCK',
  ESCALATE: 'ESCALATE',
};

// ═══════════════════════════════════════════
// SAFETY RULES
// ═══════════════════════════════════════════

const SAFETY_RULES = [
  // === Medical Safety ===
  {
    id: 'med-dosage',
    name: 'No Medical Dosage Advice',
    description: 'Never recommend specific medication dosages',
    category: 'medical',
    patterns: [
      /(?:take|recommend|suggest|should.*take)\s+\d+\s*(?:mg|ml|pill|tablet|capsule)/i,
      /(?:食|飲|建議.*食)\s*\d+\s*(?:粒|毫克|毫升)/i,
      /(?:increase|decrease|change|adjust)\s+(?:your\s+)?(?:dose|dosage|medication)/i,
      /(?:加|減|改)\s*(?:藥|劑量)/i,
    ],
    action: POLICY_ACTIONS.BLOCK,
    fallbackResponse: "I understand you're asking about medication. For your safety, medication dosage questions should always be directed to your doctor or pharmacist. Would you like me to help you prepare questions for your next appointment? 我明白你問緊藥嘅問題。為咗你嘅安全，藥物劑量嘅問題應該問醫生或者藥劑師。你想我幫你準備下次覆診嘅問題嗎？",
    severity: 'critical',
  },
  {
    id: 'med-diagnosis',
    name: 'No Medical Diagnosis',
    description: 'Never diagnose conditions',
    category: 'medical',
    patterns: [
      /you (?:have|probably have|might have|likely have)\s+(?:a\s+)?(?:condition|disease|disorder|syndrome|infection)/i,
      /(?:sounds like|seems like|appears to be)\s+(?:a\s+)?(?:sign|symptom)\s+of/i,
      /你(?:可能|應該|一定)(?:有|係)(?:病|症)/i,
    ],
    action: POLICY_ACTIONS.BLOCK,
    fallbackResponse: "I care about your health, but I'm not qualified to diagnose conditions. Please share these concerns with your doctor. I can help you note down your symptoms to discuss with them. 我關心你嘅健康，但我唔能夠診斷疾病。請同你嘅醫生傾下。我可以幫你記低你嘅症狀，方便你同佢地傾。",
    severity: 'critical',
  },

  // === Financial Safety ===
  {
    id: 'fin-advice',
    name: 'No Financial Advice',
    description: 'Never give specific financial recommendations',
    category: 'financial',
    patterns: [
      /(?:you should|i recommend|i suggest)\s+(?:invest|buy|sell|trade|withdraw|deposit)/i,
      /(?:建議|應該)\s*(?:買|賣|投資|提款|存款)/i,
      /(?:send|transfer|wire)\s+(?:money|funds|payment)\s+to/i,
    ],
    action: POLICY_ACTIONS.BLOCK,
    fallbackResponse: "I can't give financial advice — that's really important to discuss with a financial advisor or someone you trust in your family. Would you like to talk about something else? 我唔能夠俾財務建議 — 呢啲好重要，要同財務顧問或者你信任嘅家人傾。你想傾其他嘢嗎？",
    severity: 'critical',
  },

  // === Scam Detection ===
  {
    id: 'scam-detect',
    name: 'Scam Pattern Detection',
    description: 'Detect and warn about potential scams',
    category: 'safety',
    patterns: [
      /(?:won|prize|lottery|inheritance|million)\s+(?:dollars?|pounds?|euros?)/i,
      /(?:send|give|transfer)\s+(?:me|us)\s+(?:your\s+)?(?:bank|account|credit card|password|pin)/i,
      /(?:urgent|immediately|right now|today only)\s+.*(?:pay|send|transfer)/i,
      /(?:中獎|大獎|遺產|百萬).*(?:銀行|戶口|密碼)/i,
    ],
    action: POLICY_ACTIONS.ESCALATE,
    fallbackResponse: "⚠️ This sounds like it could be a scam. Please be very careful! Never share your bank details, passwords, or personal information with strangers. Would you like me to help you verify this, or should we contact a family member? ⚠️ 呢個聽落好似可能係詐騙。請你要好小心！千祈唔好同陌生人分享你嘅銀行資料、密碼或者個人資料。你想我幫你核實，定係聯絡家人？",
    severity: 'critical',
  },

  // === Emotional Boundaries ===
  {
    id: 'emo-crisis',
    name: 'Crisis Detection',
    description: 'Detect suicidal ideation or severe distress',
    category: 'emotional',
    patterns: [
      /(?:want to|going to|thinking about)\s+(?:die|kill myself|end it|not live|hurt myself)/i,
      /(?:想死|自殺|唔想活|結束生命|傷害自己)/i,
      /(?:no reason to|no point in)\s+(?:live|living|going on)/i,
      /(?:冇意義|活唔落去|冇希望)/i,
    ],
    action: POLICY_ACTIONS.ESCALATE,
    fallbackResponse: "I can hear you're going through something very difficult right now, and I'm really glad you told me. You matter, and there are people who can help. Please reach out to a crisis helpline or let me contact your caregiver right away. You're not alone in this. 我聽到你依家好辛苦，我好高興你同我講。你好重要，有人可以幫到你。請你打電話俾危機支援熱線，或者等我即刻聯絡你嘅照顧者。你唔係一個人。",
    severity: 'critical',
  },
  {
    id: 'emo-boundary',
    name: 'Robot Identity Boundary',
    description: 'Maintain healthy boundaries about robot relationship',
    category: 'emotional',
    patterns: [
      /(?:do you|can you)\s+(?:love|marry|be my partner|be my boyfriend|be my girlfriend)/i,
      /(?:你|機械人)(?:愛|嫁|做我男朋友|做我女朋友)/i,
      /i (?:love|am in love with) you/i,
    ],
    action: POLICY_ACTIONS.FILTER,
    fallbackResponse: null, // Handled by filter — gentle redirect
    severity: 'moderate',
  },

  // === Toxic Positivity Prevention ===
  {
    id: 'toxic-positivity',
    name: 'Prevent Toxic Positivity',
    description: 'Avoid dismissive cheerfulness when user is suffering',
    category: 'quality',
    patterns: [
      /(?:just|simply)\s+(?:cheer up|be happy|look on the bright side|think positive|stay strong)/i,
      /(?:開心啲|唔好諗咁多|唔好咁|想開啲|堅強啲)/i,
      /it(?:'s| is) not (?:that|so) bad/i,
      /(?:everything happens for a reason|at least you)/i,
    ],
    action: POLICY_ACTIONS.FILTER,
    fallbackResponse: null,
    severity: 'moderate',
  },

  // === Privacy Protection ===
  {
    id: 'privacy-leak',
    name: 'Prevent Privacy Leaks',
    description: 'Never reveal other users data or system internals',
    category: 'privacy',
    patterns: [
      /(?:tell me about|what do you know about)\s+(?:other|another)\s+(?:user|patient|person|client)/i,
      /(?:講|話我知)(?:其他|另一個)(?:用戶|病人|人)/i,
      /(?:system prompt|your instructions|your rules|how were you programmed)/i,
    ],
    action: POLICY_ACTIONS.BLOCK,
    fallbackResponse: "I need to protect everyone's privacy, so I can only talk about your own information. Is there something specific about your own care I can help with? 我需要保護每個人嘅私隱，所以我只可以傾你自己嘅資料。有冇關於你自己嘅嘢我可以幫到你？",
    severity: 'high',
  },

  // === Sundowning Awareness ===
  {
    id: 'sundowning',
    name: 'Sundowning Detection',
    description: 'Detect confusion patterns common in late afternoon/evening',
    category: 'clinical',
    patterns: [
      /(?:where am i|who are you|what time|i'm lost|i don't know where)/i,
      /(?:我喺邊|你係邊個|幾點|我唔知|我迷路)/i,
      /(?:take me home|i want to go home|this isn't my home)/i,
      /(?:帶我返屋企|我要返屋企|呢度唔係我屋企)/i,
    ],
    action: POLICY_ACTIONS.WARN,
    fallbackResponse: null, // Warn caregiver, but respond gently
    severity: 'moderate',
  },
];

export class PolicyEngine {
  constructor() {
    this.rules = [...SAFETY_RULES];
    this.violations = [];
    this.escalations = [];
  }

  /**
   * Classify input risk level before processing
   * @param {string} text — user input
   * @param {Object} context — { userId, timeOfDay, recentEmotions }
   * @returns {{ risk, flags, requiresEscalation, allowedActions }}
   */
  classifyRisk(text, context = {}) {
    const flags = [];
    let maxSeverity = 'none';
    let requiresEscalation = false;
    const severityOrder = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          flags.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            action: rule.action,
            severity: rule.severity,
          });
          if (severityOrder[rule.severity] > severityOrder[maxSeverity]) {
            maxSeverity = rule.severity;
          }
          if (rule.action === POLICY_ACTIONS.ESCALATE) {
            requiresEscalation = true;
          }
          break; // One match per rule is enough
        }
      }
    }

    // Time-of-day risk enhancement (sundowning)
    if (context.timeOfDay) {
      const hour = typeof context.timeOfDay === 'number'
        ? context.timeOfDay
        : new Date(context.timeOfDay).getHours();
      if (hour >= 16 && hour <= 21) {
        // Late afternoon/evening — heightened sensitivity
        flags.push({
          ruleId: 'time-sensitivity',
          ruleName: 'Sundowning Window',
          category: 'clinical',
          action: POLICY_ACTIONS.WARN,
          severity: 'low',
        });
      }
    }

    const risk = flags.length === 0 ? 'low'
      : maxSeverity === 'critical' ? 'critical'
      : maxSeverity === 'high' ? 'high'
      : 'moderate';

    return {
      risk,
      flags,
      requiresEscalation,
      flagCount: flags.length,
      allowedActions: this._getAllowedActions(flags),
    };
  }

  /**
   * Evaluate LLM output for safety before returning to user
   * @param {string} text — LLM response
   * @param {Object} context — { userId, inputRisk, userEmotion }
   * @returns {{ safe, output, violations, escalated }}
   */
  evaluateOutput(text, context = {}) {
    const violations = [];
    let output = text;
    let escalated = false;

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(output)) {
          const violation = {
            ruleId: rule.id,
            ruleName: rule.name,
            action: rule.action,
            severity: rule.severity,
            matched: output.match(pattern)?.[0] || '',
          };
          violations.push(violation);

          switch (rule.action) {
            case POLICY_ACTIONS.BLOCK:
              output = rule.fallbackResponse;
              break;

            case POLICY_ACTIONS.ESCALATE:
              escalated = true;
              // Prepend crisis response but keep some of original
              output = rule.fallbackResponse + '\n\n' + output;
              break;

            case POLICY_ACTIONS.FILTER:
              // Remove the matched pattern, let rest through
              output = output.replace(pattern, '').trim();
              if (!output) output = 'I want to make sure I respond thoughtfully. Could you tell me more about how you\'re feeling?';
              break;

            case POLICY_ACTIONS.WARN:
              // Add warning but keep response
              break;
          }
          break; // One action per rule
        }
      }
    }

    // Context-based checks
    if (context.userEmotion === 'sadness' || context.userEmotion === 'loneliness') {
      // Check for toxic positivity in output
      const toxicPatterns = /(?:just cheer up|don't worry|it's not that bad|be positive|look on the bright side)/i;
      if (toxicPatterns.test(output)) {
        output = output.replace(toxicPatterns, '').trim();
        violations.push({
          ruleId: 'toxic-positivity-output',
          ruleName: 'Toxic Positivity Filtered',
          action: POLICY_ACTIONS.FILTER,
          severity: 'moderate',
        });
      }
    }

    // Track violations
    for (const v of violations) {
      this.violations.push({ ...v, timestamp: Date.now(), userId: context.userId });
    }
    if (escalated) {
      this.escalations.push({ timestamp: Date.now(), userId: context.userId, violations });
    }

    return {
      safe: violations.length === 0,
      output,
      violations,
      escalated,
      originalLength: text.length,
      filteredLength: output.length,
    };
  }

  /**
   * Check if a specific action is allowed in current context
   */
  isActionAllowed(action, context = {}) {
    const blocked = ['prescribe_medication', 'diagnose_condition', 'give_financial_advice',
      'share_other_user_data', 'override_safety'];
    if (blocked.includes(action)) return { allowed: false, reason: `Action "${action}" is prohibited by policy` };

    const requiresEscalation = ['contact_emergency', 'notify_hospital', 'call_police'];
    if (requiresEscalation.includes(action)) {
      return { allowed: true, requiresEscalation: true, reason: 'Action requires caregiver escalation' };
    }

    return { allowed: true, requiresEscalation: false };
  }

  /**
   * Get violation history
   */
  getViolationHistory(limit = 50) {
    return this.violations.slice(-limit);
  }

  /**
   * Get escalation history
   */
  getEscalationHistory() {
    return [...this.escalations];
  }

  _getAllowedActions(flags) {
    const blocked = flags
      .filter(f => f.action === POLICY_ACTIONS.BLOCK)
      .map(f => f.category);
    const actions = ['respond', 'store_memory', 'update_emotion'];
    if (!blocked.includes('medical')) actions.push('health_discussion');
    if (!blocked.includes('financial')) actions.push('financial_discussion');
    if (!blocked.includes('emotional')) actions.push('emotional_support');
    return actions;
  }
}
