// MCP Arena — Eval Feedback
// Reads arena evaluation results and updates model rankings in the selector
// This is the bridge between the evaluation arena and the brain's decision-making

export class EvalFeedback {
  constructor(modelSelector) {
    this.selector = modelSelector;
    this.evalHistory = [];
  }

  /**
   * Process evaluation results from the arena
   * @param {Object} result — { taskId, modelId, score, dimensions, latencyMs }
   */
  processResult(result) {
    this.evalHistory.push({
      ...result,
      timestamp: Date.now(),
    });

    // Keep last 500 results
    if (this.evalHistory.length > 500) this.evalHistory.shift();

    // Recompute rankings for the task type
    this._recomputeRankings(result.taskId);
  }

  /**
   * Process a batch of evaluation results (e.g., after running full arena)
   */
  processBatch(results) {
    for (const r of results) {
      this.evalHistory.push({ ...r, timestamp: Date.now() });
    }
    if (this.evalHistory.length > 500) {
      this.evalHistory = this.evalHistory.slice(-500);
    }

    // Recompute all affected task types
    const taskTypes = [...new Set(results.map(r => r.taskId))];
    for (const tt of taskTypes) {
      this._recomputeRankings(tt);
    }
  }

  /**
   * Get the evaluation-based leaderboard for a task type
   */
  getLeaderboard(taskType = null) {
    const results = taskType
      ? this.evalHistory.filter(r => r.taskId === taskType)
      : this.evalHistory;

    // Group by model
    const modelScores = {};
    for (const r of results) {
      if (!modelScores[r.modelId]) {
        modelScores[r.modelId] = { scores: [], latencies: [], taskTypes: new Set() };
      }
      modelScores[r.modelId].scores.push(r.score || 0);
      modelScores[r.modelId].latencies.push(r.latencyMs || 0);
      modelScores[r.modelId].taskTypes.add(r.taskId);
    }

    // Compute averages
    const leaderboard = Object.entries(modelScores).map(([modelId, data]) => ({
      modelId,
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      avgLatency: Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length),
      evalCount: data.scores.length,
      tasksCovered: data.taskTypes.size,
      bestScore: Math.max(...data.scores),
      worstScore: Math.min(...data.scores),
    }));

    leaderboard.sort((a, b) => b.avgScore - a.avgScore);
    return leaderboard;
  }

  /**
   * Get recommendations for which model to use for each task
   */
  getRecommendations() {
    const taskTypes = [...new Set(this.evalHistory.map(r => r.taskId))];
    const recommendations = {};

    for (const taskType of taskTypes) {
      const lb = this.getLeaderboard(taskType);
      if (lb.length > 0) {
        recommendations[taskType] = {
          recommended: lb[0].modelId,
          score: lb[0].avgScore,
          alternative: lb[1]?.modelId || null,
          alternativeScore: lb[1]?.avgScore || null,
        };
      }
    }

    return recommendations;
  }

  _recomputeRankings(taskType) {
    const leaderboard = this.getLeaderboard(taskType);
    if (leaderboard.length > 0) {
      const ranked = leaderboard.map(l => l.modelId);
      this.selector.updateRankings(taskType, ranked);

      const scores = {};
      for (const l of leaderboard) {
        scores[l.modelId] = l.avgScore;
      }
      this.selector.updateScores(taskType, scores);
    }
  }
}
