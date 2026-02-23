// MCP Arena — Runtime Observe Server
// Health signal monitoring: mood patterns, conversation frequency,
// sleep/appetite mentions, anomaly detection

export class MCPObserveServer {
  constructor() {
    this.name = 'mcp-observe';
    this.description = 'Health signal monitoring, anomaly detection, and silence/absence detection';
    this.signals = [];
    this.baselines = {};
    this.anomalies = [];

    // Silence detection state
    this.lastInteraction = {};  // userId → timestamp
    this.silenceAlerts = [];
    this.silenceThresholds = {
      mild: 4 * 60 * 60 * 1000,      // 4 hours — check in
      moderate: 12 * 60 * 60 * 1000,  // 12 hours — concern
      severe: 24 * 60 * 60 * 1000,    // 24 hours — alert caregiver
      critical: 48 * 60 * 60 * 1000,  // 48 hours — emergency
    };
    // Track conversation frequency baselines per user
    this.interactionHistory = {};  // userId → [timestamps]
  }

  getTools() {
    return [
      {
        name: 'ingest_signal',
        description: 'Record a health-related signal from conversation',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            signalType: { type: 'string', enum: ['mood', 'sleep', 'appetite', 'pain', 'activity', 'social', 'cognitive', 'medication'] },
            value: { type: 'string', description: 'Signal value or description' },
            severity: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
            source: { type: 'string', default: 'conversation' },
          },
          required: ['userId', 'signalType', 'value'],
        },
      },
      {
        name: 'update_baseline',
        description: 'Update the normal baseline for a signal type',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            signalType: { type: 'string' },
            normalRange: { type: 'string', description: 'Description of normal range' },
          },
          required: ['userId', 'signalType'],
        },
      },
      {
        name: 'detect_anomaly',
        description: 'Check recent signals for anomalies against baseline',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            lookbackDays: { type: 'number', default: 7 },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_health_summary',
        description: 'Get a health observation summary for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            days: { type: 'number', default: 7 },
          },
          required: ['userId'],
        },
      },
      {
        name: 'record_interaction',
        description: 'Record that a user interaction occurred (for silence detection)',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'check_silence',
        description: 'Check if a user has been silent/absent for concerning duration',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_interaction_pattern',
        description: 'Get conversation frequency pattern for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            days: { type: 'number', default: 7 },
          },
          required: ['userId'],
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'ingest_signal': {
        const signal = {
          id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          userId: params.userId,
          signalType: params.signalType,
          value: params.value,
          severity: params.severity || 0.5,
          source: params.source || 'conversation',
          timestamp: Date.now(),
        };
        this.signals.push(signal);
        if (this.signals.length > 1000) this.signals.shift();

        // Auto-check for anomalies
        const anomaly = this._checkSignalAnomaly(signal);

        return {
          signalId: signal.id,
          recorded: true,
          anomalyDetected: !!anomaly,
          anomaly,
        };
      }

      case 'update_baseline': {
        const key = `${params.userId}:${params.signalType}`;
        this.baselines[key] = {
          userId: params.userId,
          signalType: params.signalType,
          normalRange: params.normalRange,
          updatedAt: Date.now(),
        };
        return { updated: true, key };
      }

      case 'detect_anomaly': {
        const lookbackMs = (params.lookbackDays || 7) * 24 * 60 * 60 * 1000;
        const since = Date.now() - lookbackMs;
        const userSignals = this.signals.filter(
          s => s.userId === params.userId && s.timestamp >= since
        );

        const anomalies = [];
        // Check for patterns
        const byType = {};
        for (const s of userSignals) {
          if (!byType[s.signalType]) byType[s.signalType] = [];
          byType[s.signalType].push(s);
        }

        // Mood: check for persistent negative
        if (byType.mood) {
          const negativeMoods = byType.mood.filter(s => s.severity > 0.6);
          if (negativeMoods.length > byType.mood.length * 0.6) {
            anomalies.push({
              type: 'persistent_negative_mood',
              severity: 'moderate',
              detail: `${negativeMoods.length}/${byType.mood.length} mood signals are negative`,
              recommendation: 'Consider caregiver notification',
            });
          }
        }

        // Sleep: check for disturbance mentions
        if (byType.sleep && byType.sleep.length >= 3) {
          const poorSleep = byType.sleep.filter(s => s.severity > 0.5);
          if (poorSleep.length >= 2) {
            anomalies.push({
              type: 'sleep_disturbance',
              severity: 'moderate',
              detail: `${poorSleep.length} sleep disturbance signals in ${params.lookbackDays || 7} days`,
              recommendation: 'Discuss with healthcare provider',
            });
          }
        }

        // Activity: check for reduced engagement
        if (byType.activity) {
          const low = byType.activity.filter(s => s.severity < 0.3);
          if (low.length > byType.activity.length * 0.5) {
            anomalies.push({
              type: 'reduced_activity',
              severity: 'low',
              detail: 'Activity levels appear reduced',
              recommendation: 'Encourage gentle activities',
            });
          }
        }

        this.anomalies.push(...anomalies.map(a => ({ ...a, userId: params.userId, timestamp: Date.now() })));

        return {
          userId: params.userId,
          signalsAnalyzed: userSignals.length,
          anomaliesFound: anomalies.length,
          anomalies,
        };
      }

      case 'get_health_summary': {
        const days = params.days || 7;
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        const userSignals = this.signals.filter(
          s => s.userId === params.userId && s.timestamp >= since
        );

        const byType = {};
        for (const s of userSignals) {
          if (!byType[s.signalType]) byType[s.signalType] = [];
          byType[s.signalType].push(s);
        }

        const summary = {
          userId: params.userId,
          period: `${days} days`,
          totalSignals: userSignals.length,
          categories: {},
          recentAnomalies: this.anomalies
            .filter(a => a.userId === params.userId && a.timestamp >= since)
            .slice(-5),
          overallStatus: 'normal',
        };

        for (const [type, signals] of Object.entries(byType)) {
          const avgSeverity = signals.reduce((sum, s) => sum + s.severity, 0) / signals.length;
          summary.categories[type] = {
            count: signals.length,
            avgSeverity: Math.round(avgSeverity * 100) / 100,
            latest: signals[signals.length - 1]?.value,
          };
        }

        // Determine overall status
        const highSeverity = userSignals.filter(s => s.severity > 0.7).length;
        if (highSeverity > userSignals.length * 0.3) summary.overallStatus = 'concerning';
        else if (highSeverity > 0) summary.overallStatus = 'monitor';

        return summary;
      }

      case 'record_interaction': {
        const now = Date.now();
        this.lastInteraction[params.userId] = now;

        // Build interaction history
        if (!this.interactionHistory[params.userId]) {
          this.interactionHistory[params.userId] = [];
        }
        this.interactionHistory[params.userId].push(now);
        // Keep last 500 interactions
        if (this.interactionHistory[params.userId].length > 500) {
          this.interactionHistory[params.userId] = this.interactionHistory[params.userId].slice(-500);
        }

        return { recorded: true, timestamp: now };
      }

      case 'check_silence': {
        const lastTime = this.lastInteraction[params.userId];
        if (!lastTime) {
          return {
            userId: params.userId,
            status: 'no_data',
            message: 'No interaction recorded yet',
            silenceDuration: null,
          };
        }

        const silenceMs = Date.now() - lastTime;
        let severity = 'none';
        let recommendation = 'Normal activity';

        if (silenceMs >= this.silenceThresholds.critical) {
          severity = 'critical';
          recommendation = 'EMERGENCY: No interaction for 48+ hours. Contact caregiver and emergency services immediately.';
        } else if (silenceMs >= this.silenceThresholds.severe) {
          severity = 'severe';
          recommendation = 'ALERT: No interaction for 24+ hours. Notify primary caregiver urgently.';
        } else if (silenceMs >= this.silenceThresholds.moderate) {
          severity = 'moderate';
          recommendation = 'CONCERN: No interaction for 12+ hours. Send gentle check-in notification to caregiver.';
        } else if (silenceMs >= this.silenceThresholds.mild) {
          severity = 'mild';
          recommendation = 'User has been quiet for 4+ hours. Consider proactive check-in if within active hours.';
        }

        // Check if this deviates from their normal pattern
        const pattern = this._getInteractionPattern(params.userId);
        let patternDeviation = false;
        if (pattern.avgGapMs > 0 && silenceMs > pattern.avgGapMs * 2.5) {
          patternDeviation = true;
          if (severity === 'none') {
            severity = 'mild';
            recommendation = `User is quiet ${Math.round(silenceMs / pattern.avgGapMs)}x longer than their usual pattern. Possible concern.`;
          }
        }

        // Log alert if severity > none
        if (severity !== 'none') {
          this.silenceAlerts.push({
            userId: params.userId,
            severity,
            silenceMs,
            silenceHours: Math.round(silenceMs / 3600000 * 10) / 10,
            patternDeviation,
            timestamp: Date.now(),
          });
        }

        return {
          userId: params.userId,
          status: severity,
          silenceHours: Math.round(silenceMs / 3600000 * 10) / 10,
          lastInteraction: new Date(lastTime).toISOString(),
          recommendation,
          patternDeviation,
          normalGapHours: pattern.avgGapMs > 0 ? Math.round(pattern.avgGapMs / 3600000 * 10) / 10 : null,
        };
      }

      case 'get_interaction_pattern': {
        const pattern = this._getInteractionPattern(params.userId, params.days || 7);
        return {
          userId: params.userId,
          ...pattern,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  _getInteractionPattern(userId, days = 7) {
    const history = this.interactionHistory[userId] || [];
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const recent = history.filter(t => t >= since);

    if (recent.length < 2) {
      return { interactions: recent.length, avgGapMs: 0, avgGapHours: 0, peakHours: [], quietHours: [] };
    }

    // Compute gaps between interactions
    const gaps = [];
    for (let i = 1; i < recent.length; i++) {
      gaps.push(recent[i] - recent[i - 1]);
    }
    const avgGapMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    // Find peak and quiet hours
    const hourCounts = new Array(24).fill(0);
    for (const t of recent) {
      hourCounts[new Date(t).getHours()]++;
    }
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((c, h) => ({ hour: h, count: c }))
      .filter(h => h.count >= maxCount * 0.7)
      .map(h => h.hour);
    const quietHours = hourCounts
      .map((c, h) => ({ hour: h, count: c }))
      .filter(h => h.count === 0)
      .map(h => h.hour);

    return {
      interactions: recent.length,
      avgGapMs,
      avgGapHours: Math.round(avgGapMs / 3600000 * 10) / 10,
      peakHours,
      quietHours,
      interactionsPerDay: Math.round(recent.length / days * 10) / 10,
    };
  }

  _checkSignalAnomaly(signal) {
    // Quick check: high severity signals
    if (signal.severity > 0.8) {
      return {
        type: `high_severity_${signal.signalType}`,
        severity: 'high',
        detail: `High severity ${signal.signalType} signal: ${signal.value}`,
      };
    }
    return null;
  }
}
