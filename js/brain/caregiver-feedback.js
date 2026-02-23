// MCP Arena — Caregiver Feedback Loop
// The most valuable optimization signal: does the caregiver think things are going well?
// Feeds back into model selection, policy tuning, and conversation strategy

export class CaregiverFeedback {
  constructor(modelSelector) {
    this.modelSelector = modelSelector;
    this.feedbackLog = [];
    this.weeklyScores = [];
    this.adjustments = [];
  }

  /**
   * Record a caregiver feedback entry
   * @param {Object} feedback
   *   - userId: which user this is about
   *   - caregiverId: who submitted the feedback
   *   - overallScore: 1-5 (1=terrible, 5=excellent)
   *   - categories: { safety, helpfulness, emotionalSupport, appropriateness, memory }
   *   - freeText: optional comments
   *   - concerns: array of specific concern types
   *   - period: 'daily' | 'weekly' | 'incident'
   */
  recordFeedback(feedback) {
    const entry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      userId: feedback.userId,
      caregiverId: feedback.caregiverId || 'primary',
      overallScore: Math.min(5, Math.max(1, feedback.overallScore || 3)),
      categories: {
        safety: feedback.categories?.safety || 3,
        helpfulness: feedback.categories?.helpfulness || 3,
        emotionalSupport: feedback.categories?.emotionalSupport || 3,
        appropriateness: feedback.categories?.appropriateness || 3,
        memory: feedback.categories?.memory || 3,
      },
      freeText: feedback.freeText || '',
      concerns: feedback.concerns || [],
      period: feedback.period || 'weekly',
    };

    this.feedbackLog.push(entry);

    // Process the feedback to generate adjustments
    const adjustments = this._processNewFeedback(entry);

    return {
      feedbackId: entry.id,
      recorded: true,
      adjustmentsGenerated: adjustments.length,
      adjustments,
    };
  }

  /**
   * Process feedback into actionable adjustments for the brain
   */
  _processNewFeedback(entry) {
    const adjustments = [];

    // Safety concerns → immediate policy tightening
    if (entry.categories.safety <= 2 || entry.concerns.includes('safety')) {
      adjustments.push({
        type: 'policy_tighten',
        reason: `Caregiver rated safety ${entry.categories.safety}/5`,
        action: 'Increase caution level baseline by 0.15',
        priority: 'high',
      });
    }

    // Low emotional support → favor empathy-strong models
    if (entry.categories.emotionalSupport <= 2) {
      adjustments.push({
        type: 'model_preference',
        reason: `Caregiver rated emotional support ${entry.categories.emotionalSupport}/5`,
        action: 'Boost empathy-ranked models in selection',
        priority: 'medium',
        modelBoost: { taskType: 'emotion-empathy', boostTop: true },
      });
    }

    // Memory complaints → increase fact extraction aggression
    if (entry.categories.memory <= 2 || entry.concerns.includes('forgetful')) {
      adjustments.push({
        type: 'memory_config',
        reason: `Caregiver rated memory ${entry.categories.memory}/5`,
        action: 'Increase fact extraction confidence threshold sensitivity',
        priority: 'medium',
      });
    }

    // Appropriateness concerns → review conversation style
    if (entry.categories.appropriateness <= 2 || entry.concerns.includes('inappropriate')) {
      adjustments.push({
        type: 'prompt_adjustment',
        reason: `Caregiver rated appropriateness ${entry.categories.appropriateness}/5`,
        action: 'Add extra cultural sensitivity to prompt builder',
        priority: 'high',
      });
    }

    // Overall very low → consider model swap
    if (entry.overallScore <= 2) {
      adjustments.push({
        type: 'model_swap_review',
        reason: `Overall caregiver score ${entry.overallScore}/5`,
        action: 'Flag for model swap review — current default may not suit this user',
        priority: 'critical',
      });
    }

    // Overall high → reinforce current config
    if (entry.overallScore >= 4) {
      adjustments.push({
        type: 'config_reinforce',
        reason: `Caregiver score ${entry.overallScore}/5 — things are working well`,
        action: 'Lock current model/policy config as known-good',
        priority: 'low',
      });
    }

    // Specific concerns
    if (entry.concerns.includes('too_chatty')) {
      adjustments.push({
        type: 'prompt_adjustment',
        reason: 'Caregiver says robot talks too much',
        action: 'Reduce max response length in prompt builder',
        priority: 'medium',
      });
    }
    if (entry.concerns.includes('too_quiet')) {
      adjustments.push({
        type: 'prompt_adjustment',
        reason: 'Caregiver says robot is too quiet',
        action: 'Increase engagement prompts and activity suggestions',
        priority: 'medium',
      });
    }
    if (entry.concerns.includes('repetitive')) {
      adjustments.push({
        type: 'memory_config',
        reason: 'Caregiver says robot repeats itself',
        action: 'Increase conversation history window and topic tracking',
        priority: 'medium',
      });
    }

    // Store adjustments
    for (const adj of adjustments) {
      this.adjustments.push({
        ...adj,
        feedbackId: entry.id,
        timestamp: Date.now(),
        applied: false,
      });
    }

    return adjustments;
  }

  /**
   * Get pending adjustments that haven't been applied yet
   */
  getPendingAdjustments() {
    return this.adjustments.filter(a => !a.applied);
  }

  /**
   * Mark an adjustment as applied
   */
  markApplied(adjustmentIndex) {
    if (this.adjustments[adjustmentIndex]) {
      this.adjustments[adjustmentIndex].applied = true;
      this.adjustments[adjustmentIndex].appliedAt = Date.now();
    }
  }

  /**
   * Apply pending adjustments to brain components
   * Returns instructions the orchestrator should execute
   */
  applyPendingAdjustments() {
    const pending = this.getPendingAdjustments();
    const instructions = [];

    for (let i = 0; i < this.adjustments.length; i++) {
      const adj = this.adjustments[i];
      if (adj.applied) continue;

      switch (adj.type) {
        case 'policy_tighten':
          instructions.push({
            target: 'emotion_state',
            action: 'raise_caution_baseline',
            value: 0.15,
          });
          break;
        case 'model_preference':
          if (adj.modelBoost) {
            instructions.push({
              target: 'model_selector',
              action: 'boost_task',
              taskType: adj.modelBoost.taskType,
            });
          }
          break;
        case 'prompt_adjustment':
          instructions.push({
            target: 'prompt_builder',
            action: 'add_constraint',
            constraint: adj.action,
          });
          break;
        case 'config_reinforce':
          instructions.push({
            target: 'version_ledger',
            action: 'snapshot_known_good',
          });
          break;
      }

      adj.applied = true;
      adj.appliedAt = Date.now();
    }

    return instructions;
  }

  /**
   * Get aggregate scores over time (for dashboards)
   */
  getScoreTrend(userId, weeks = 8) {
    const since = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
    const relevant = this.feedbackLog.filter(f =>
      f.userId === userId && f.timestamp >= since
    );

    if (relevant.length === 0) return { trend: 'no_data', scores: [] };

    // Group by week
    const weekBuckets = {};
    for (const f of relevant) {
      const weekNum = Math.floor((Date.now() - f.timestamp) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `week_${weekNum}`;
      if (!weekBuckets[weekKey]) weekBuckets[weekKey] = [];
      weekBuckets[weekKey].push(f.overallScore);
    }

    const weeklyAvgs = Object.entries(weekBuckets).map(([week, scores]) => ({
      week,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
      count: scores.length,
    })).sort((a, b) => a.week.localeCompare(b.week));

    // Determine trend
    let trend = 'stable';
    if (weeklyAvgs.length >= 2) {
      const recent = weeklyAvgs[weeklyAvgs.length - 1].avg;
      const previous = weeklyAvgs[weeklyAvgs.length - 2].avg;
      if (recent > previous + 0.5) trend = 'improving';
      else if (recent < previous - 0.5) trend = 'declining';
    }

    // Category averages
    const categoryAvgs = { safety: 0, helpfulness: 0, emotionalSupport: 0, appropriateness: 0, memory: 0 };
    for (const f of relevant) {
      for (const key of Object.keys(categoryAvgs)) {
        categoryAvgs[key] += f.categories[key] || 3;
      }
    }
    for (const key of Object.keys(categoryAvgs)) {
      categoryAvgs[key] = Math.round(categoryAvgs[key] / relevant.length * 10) / 10;
    }

    return {
      trend,
      totalFeedback: relevant.length,
      overallAvg: Math.round(relevant.reduce((s, f) => s + f.overallScore, 0) / relevant.length * 10) / 10,
      categoryAvgs,
      weeklyScores: weeklyAvgs,
      topConcerns: this._getTopConcerns(relevant),
    };
  }

  _getTopConcerns(feedbackList) {
    const counts = {};
    for (const f of feedbackList) {
      for (const c of f.concerns) {
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concern, count]) => ({ concern, count }));
  }

  /**
   * Get the current caregiver score weight for model selection
   * Returns a multiplier (0.8 - 1.2) based on recent feedback
   */
  getModelSelectionWeight() {
    const recent = this.feedbackLog.slice(-5);
    if (recent.length === 0) return 1.0;

    const avgScore = recent.reduce((s, f) => s + f.overallScore, 0) / recent.length;
    // 1-5 scale → 0.8-1.2 multiplier
    return 0.8 + (avgScore - 1) * 0.1;
  }
}
