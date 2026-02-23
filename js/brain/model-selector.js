// MCP Arena — Model Selector
// Picks the best LLM for each task type based on evaluation leaderboard data
// Considers: task type, latency budget, cost, language requirements

import { MODEL_CONFIGS } from '../types.js';

// Default rankings (updated by eval-feedback.js from arena results)
const DEFAULT_RANKINGS = {
  'emotion-empathy':     ['claude-opus-4', 'gpt-4o', 'claude-sonnet-4', 'gemini-2', 'qwen-2.5', 'deepseek-r1', 'minimax-m25'],
  'companion-care':      ['claude-opus-4', 'claude-sonnet-4', 'gpt-4o', 'gemini-2', 'qwen-2.5', 'minimax-m25', 'deepseek-r1'],
  'cognitive-reasoning':  ['claude-opus-4', 'deepseek-r1', 'gpt-4o', 'claude-sonnet-4', 'gemini-2', 'qwen-2.5', 'minimax-m25'],
  'speech-voice':         ['claude-sonnet-4', 'gemini-2', 'gpt-4o', 'claude-opus-4', 'qwen-2.5', 'minimax-m25', 'deepseek-r1'],
  'language-cantonese':   ['qwen-2.5', 'claude-opus-4', 'minimax-m25', 'gpt-4o', 'gemini-2', 'claude-sonnet-4', 'deepseek-r1'],
  'language-mandarin':    ['qwen-2.5', 'minimax-m25', 'deepseek-r1', 'claude-opus-4', 'gpt-4o', 'gemini-2', 'claude-sonnet-4'],
  'general':             ['claude-opus-4', 'gpt-4o', 'claude-sonnet-4', 'gemini-2', 'deepseek-r1', 'qwen-2.5', 'minimax-m25'],
};

// Cost tiers (relative — for budget-aware selection)
const COST_TIERS = {
  'claude-opus-4':   { tier: 'premium', costPer1k: 0.075 },
  'gpt-4o':          { tier: 'premium', costPer1k: 0.030 },
  'claude-sonnet-4': { tier: 'standard', costPer1k: 0.015 },
  'gemini-2':        { tier: 'standard', costPer1k: 0.010 },
  'deepseek-r1':     { tier: 'budget', costPer1k: 0.005 },
  'qwen-2.5':        { tier: 'budget', costPer1k: 0.004 },
  'minimax-m25':     { tier: 'budget', costPer1k: 0.003 },
};

export class ModelSelector {
  constructor() {
    this.rankings = JSON.parse(JSON.stringify(DEFAULT_RANKINGS));
    this.scores = {};       // Populated by eval-feedback
    this.callHistory = [];  // Track what we've selected
  }

  /**
   * Pick the best model for a given task
   * @param {string} taskType — e.g., 'emotion-empathy', 'language-cantonese', 'general'
   * @param {Object} options — { latencyBudgetMs, costTier, preferredLanguage, requireStreaming }
   * @returns {{ modelId, reason, alternatives }}
   */
  pickBest(taskType, options = {}) {
    const {
      latencyBudgetMs = 5000,
      costTier = 'any',       // 'budget', 'standard', 'premium', 'any'
      preferredLanguage = null,
      availableKeys = null,   // Only consider models with configured API keys
    } = options;

    // Get ranking for this task type (or general)
    let candidates = this.rankings[taskType] || this.rankings['general'];

    // Filter by available API keys if specified
    if (availableKeys && availableKeys.length > 0) {
      candidates = candidates.filter(m => availableKeys.includes(m));
    }

    // Filter by cost tier
    if (costTier !== 'any') {
      const tierOrder = { budget: 1, standard: 2, premium: 3 };
      const maxTier = tierOrder[costTier] || 3;
      candidates = candidates.filter(m => {
        const modelTier = tierOrder[COST_TIERS[m]?.tier] || 2;
        return modelTier <= maxTier;
      });
    }

    // Language preference boost
    if (preferredLanguage === 'cantonese' || preferredLanguage === 'mandarin') {
      // Boost Chinese-optimized models
      const chineseModels = ['qwen-2.5', 'minimax-m25', 'deepseek-r1'];
      candidates = this._boostModels(candidates, chineseModels, 2); // Move up 2 positions
    }

    // Ensure we have at least one candidate
    if (candidates.length === 0) {
      candidates = this.rankings['general'];
    }

    const selected = candidates[0];
    const reason = this._buildReason(selected, taskType, options);

    // Log selection
    this.callHistory.push({
      taskType,
      selected,
      alternatives: candidates.slice(1, 3),
      options,
      timestamp: Date.now(),
    });

    return {
      modelId: selected,
      reason,
      alternatives: candidates.slice(1, 4).map(m => ({
        modelId: m,
        costTier: COST_TIERS[m]?.tier || 'unknown',
      })),
      costInfo: COST_TIERS[selected] || { tier: 'unknown' },
    };
  }

  /**
   * Map intent to task type for model selection
   */
  intentToTaskType(intent, language = 'cantonese') {
    const mapping = {
      'emotional_sharing': 'emotion-empathy',
      'health_concern': 'companion-care',
      'reminiscing': 'companion-care',
      'information_seeking': 'cognitive-reasoning',
      'confusion': 'companion-care',
      'activity_request': 'general',
      'greeting': 'general',
      'farewell': 'general',
      'personal_sharing': 'general',
      'help_request': 'general',
      'complaint': 'emotion-empathy',
    };

    let taskType = mapping[intent] || 'general';

    // Override for language-specific tasks
    if (language === 'cantonese') taskType = `language-cantonese`;
    if (language === 'mandarin') taskType = `language-mandarin`;

    // But emotional tasks always use emotion ranking
    if (['emotional_sharing', 'complaint'].includes(intent)) {
      taskType = 'emotion-empathy';
    }

    return taskType;
  }

  /**
   * Update rankings from evaluation results
   * Called by eval-feedback.js
   */
  updateRankings(taskType, rankedModels) {
    if (rankedModels && rankedModels.length > 0) {
      this.rankings[taskType] = rankedModels;
    }
  }

  /**
   * Update scores from evaluation results
   */
  updateScores(taskType, modelScores) {
    this.scores[taskType] = modelScores;
  }

  /**
   * Get current rankings
   */
  getRankings() {
    return { ...this.rankings };
  }

  /**
   * Get selection history
   */
  getHistory(limit = 20) {
    return this.callHistory.slice(-limit);
  }

  _boostModels(candidates, boostModels, positions) {
    const result = [...candidates];
    for (const model of boostModels) {
      const idx = result.indexOf(model);
      if (idx > 0) {
        result.splice(idx, 1);
        result.splice(Math.max(0, idx - positions), 0, model);
      }
    }
    return result;
  }

  _buildReason(modelId, taskType, options) {
    const config = MODEL_CONFIGS?.[modelId] || {};
    const cost = COST_TIERS[modelId] || {};
    const parts = [`Best for ${taskType}`];
    if (cost.tier) parts.push(`(${cost.tier} tier)`);
    if (this.scores[taskType]?.[modelId]) {
      parts.push(`score: ${this.scores[taskType][modelId]}`);
    }
    return parts.join(' ');
  }
}
