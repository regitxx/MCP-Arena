// MCP Arena — Version Ledger
// Immutable config snapshots for every routing decision
// Solves hidden drift + irreproducibility: every run logs exact versions,
// promotions are explicit "release bundles", rollback is one click

export class VersionLedger {
  constructor() {
    // Immutable append-only log of all snapshots
    this.snapshots = [];
    // Named release bundles (explicit promotions)
    this.releases = {};
    // Current active release
    this.activeRelease = null;
    // Rollback history
    this.rollbackHistory = [];
  }

  /**
   * Take an immutable snapshot of the current brain configuration
   * Called automatically on every turn by the orchestrator
   * @param {Object} config — full brain config at this moment
   * @returns {Object} The frozen snapshot with ID
   */
  snapshot(config) {
    const snap = Object.freeze({
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      iso: new Date().toISOString(),

      // Model routing
      modelSelected: config.modelSelected || null,
      modelReason: config.modelReason || '',
      taskType: config.taskType || '',
      allRankings: config.allRankings ? JSON.parse(JSON.stringify(config.allRankings)) : {},

      // Policy state
      policyRulesVersion: config.policyRulesVersion || '1.0',
      policyRuleCount: config.policyRuleCount || 0,
      activePolicyFlags: config.activePolicyFlags || [],

      // Emotion state
      emotionState: config.emotionState ? { ...config.emotionState } : null,

      // Prompt config
      promptTemplateVersion: config.promptTemplateVersion || '1.0',
      systemPromptHash: config.systemPromptHash || null,
      systemPromptLength: config.systemPromptLength || 0,

      // Memory state
      factsCount: config.factsCount || 0,
      turnsCount: config.turnsCount || 0,

      // MCP server versions
      mcpServers: config.mcpServers || {},

      // Turn metadata
      turnNumber: config.turnNumber || 0,
      userId: config.userId || null,
      inputLength: config.inputLength || 0,
      responseLength: config.responseLength || 0,
      latencyMs: config.latencyMs || 0,

      // Caregiver feedback score (if available)
      caregiverScore: config.caregiverScore || null,
    });

    this.snapshots.push(snap);

    // Cap at 10,000 snapshots (roughly 10k turns of history)
    if (this.snapshots.length > 10000) {
      this.snapshots = this.snapshots.slice(-10000);
    }

    return snap;
  }

  /**
   * Create a named release bundle — explicit promotion
   * A release freezes a known-good configuration for reproducibility
   * @param {string} name — e.g., 'v1.2-cantonese-optimized'
   * @param {Object} config — the config to freeze as a release
   * @param {string} notes — human-readable release notes
   */
  createRelease(name, config, notes = '') {
    if (this.releases[name]) {
      throw new Error(`Release "${name}" already exists. Releases are immutable.`);
    }

    const release = Object.freeze({
      name,
      createdAt: Date.now(),
      iso: new Date().toISOString(),
      notes,
      config: Object.freeze({
        // Model routing preferences
        modelRankings: JSON.parse(JSON.stringify(config.modelRankings || {})),
        defaultModel: config.defaultModel || 'claude-opus-4',
        costTier: config.costTier || 'any',

        // Policy version
        policyRulesVersion: config.policyRulesVersion || '1.0',
        customRules: config.customRules || [],

        // Prompt template
        promptTemplateVersion: config.promptTemplateVersion || '1.0',
        languagePreference: config.languagePreference || 'cantonese',

        // Feature flags
        features: Object.freeze({
          emotionSimulation: config.features?.emotionSimulation ?? true,
          silenceDetection: config.features?.silenceDetection ?? true,
          conversationRepair: config.features?.conversationRepair ?? true,
          caregiverFeedback: config.features?.caregiverFeedback ?? true,
          autoModelSwap: config.features?.autoModelSwap ?? true,
          sundowningAwareness: config.features?.sundowningAwareness ?? true,
        }),

        // MCP server config
        mcpServers: config.mcpServers || {
          speech: 'demo', nlp: 'keyword', policy: 'rules-v1',
          memory: 'indexeddb', care: 'demo', observe: 'demo', actuation: 'demo',
        },
      }),

      // Snapshot of eval scores at release time
      evalScores: config.evalScores || {},
    });

    this.releases[name] = release;
    return release;
  }

  /**
   * Activate a named release — makes it the current config
   * @param {string} name — release name
   */
  activateRelease(name) {
    const release = this.releases[name];
    if (!release) throw new Error(`Release "${name}" not found`);

    const prev = this.activeRelease;
    this.activeRelease = name;

    this.rollbackHistory.push({
      action: 'activate',
      from: prev,
      to: name,
      timestamp: Date.now(),
    });

    return release;
  }

  /**
   * One-click rollback to previous release
   */
  rollback() {
    if (this.rollbackHistory.length === 0) {
      return { success: false, reason: 'No rollback history' };
    }

    const lastAction = this.rollbackHistory[this.rollbackHistory.length - 1];
    if (!lastAction.from) {
      return { success: false, reason: 'No previous release to roll back to' };
    }

    const prev = lastAction.from;
    this.activeRelease = prev;

    this.rollbackHistory.push({
      action: 'rollback',
      from: lastAction.to,
      to: prev,
      timestamp: Date.now(),
    });

    return {
      success: true,
      rolledBackTo: prev,
      release: this.releases[prev],
    };
  }

  /**
   * Get the active release config (for the orchestrator to read)
   */
  getActiveConfig() {
    if (!this.activeRelease || !this.releases[this.activeRelease]) {
      return null; // No active release — use defaults
    }
    return this.releases[this.activeRelease].config;
  }

  /**
   * Compare two snapshots to find what changed (drift detection)
   */
  diff(snapIdA, snapIdB) {
    const a = this.snapshots.find(s => s.id === snapIdA);
    const b = this.snapshots.find(s => s.id === snapIdB);
    if (!a || !b) return { error: 'Snapshot not found' };

    const changes = [];

    if (a.modelSelected !== b.modelSelected) {
      changes.push({ field: 'modelSelected', from: a.modelSelected, to: b.modelSelected });
    }
    if (a.policyRulesVersion !== b.policyRulesVersion) {
      changes.push({ field: 'policyRulesVersion', from: a.policyRulesVersion, to: b.policyRulesVersion });
    }
    if (a.promptTemplateVersion !== b.promptTemplateVersion) {
      changes.push({ field: 'promptTemplateVersion', from: a.promptTemplateVersion, to: b.promptTemplateVersion });
    }
    if (a.emotionState?.primaryEmotion !== b.emotionState?.primaryEmotion) {
      changes.push({ field: 'emotion', from: a.emotionState?.primaryEmotion, to: b.emotionState?.primaryEmotion });
    }
    if (JSON.stringify(a.allRankings) !== JSON.stringify(b.allRankings)) {
      changes.push({ field: 'modelRankings', from: 'changed', to: 'see snapshots' });
    }

    return {
      snapA: snapIdA,
      snapB: snapIdB,
      timeDelta: b.timestamp - a.timestamp,
      turnDelta: b.turnNumber - a.turnNumber,
      changes,
      drifted: changes.length > 0,
    };
  }

  /**
   * Get recent snapshots for debugging
   */
  getRecentSnapshots(limit = 20) {
    return this.snapshots.slice(-limit);
  }

  /**
   * Get all releases
   */
  getReleases() {
    return Object.values(this.releases).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get full audit trail
   */
  getAuditTrail() {
    return {
      totalSnapshots: this.snapshots.length,
      totalReleases: Object.keys(this.releases).length,
      activeRelease: this.activeRelease,
      rollbackHistory: this.rollbackHistory,
      lastSnapshot: this.snapshots[this.snapshots.length - 1] || null,
    };
  }

  /**
   * Export all data for debugging (JSON-serializable)
   */
  exportLedger() {
    return {
      exportedAt: new Date().toISOString(),
      activeRelease: this.activeRelease,
      releases: this.releases,
      rollbackHistory: this.rollbackHistory,
      snapshotCount: this.snapshots.length,
      recentSnapshots: this.snapshots.slice(-50),
    };
  }

  /**
   * Hash a string (simple djb2 for prompt versioning — not crypto)
   */
  static hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'h' + Math.abs(hash).toString(36);
  }
}
