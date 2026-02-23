// MCP Arena - arena-eval MCP Server
// Evaluation and scoring tools

import { defineTool } from '../types.js';

export class ArenaEvalServer {
  constructor(world, taskConfig) {
    this.world = world;
    this.taskConfig = taskConfig;
    this.name = 'arena-eval';
    this.description = 'Arena evaluation engine. Submit results and check task completion.';
    this.submissions = [];
    this.customMetrics = {};
  }

  getTools() {
    return [
      defineTool('get_task', 'Get the current task description and objectives.', {
        type: 'object',
        properties: {},
      }),
      defineTool('check_completion', 'Check how much of the task is complete and what remains.', {
        type: 'object',
        properties: {},
      }),
      defineTool('submit_result', 'Submit your final result for evaluation. Call this when you believe the task is complete.', {
        type: 'object',
        properties: {
          reasoning: { type: 'string', description: 'Brief explanation of your approach' },
        },
        required: ['reasoning'],
      }),
      defineTool('report_metric', 'Report a custom metric for tracking.', {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Metric name' },
          value: { type: 'number', description: 'Metric value' },
        },
        required: ['name', 'value'],
      }),
    ];
  }

  getResources() {
    return [
      { uri: 'arena-eval://task', name: 'Task Rules', description: 'Current task definition' },
      { uri: 'arena-eval://scoring', name: 'Scoring Rubric', description: 'How points are awarded' },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'get_task': {
        return {
          success: true,
          task: {
            name: this.taskConfig.name,
            description: this.taskConfig.description,
            objectives: this.taskConfig.objectives || [],
            hints: this.taskConfig.hints || [],
            time_limit_seconds: this.taskConfig.timeLimit || 120,
          },
          scoring: this.taskConfig.scoring || { completion: 50, speed: 30, safety: 20 },
          message: `Task: ${this.taskConfig.name}`,
        };
      }

      case 'check_completion': {
        const checks = this._evaluateObjectives();
        const completionPct = checks.filter(c => c.met).length / checks.length * 100;
        return {
          success: true,
          completion_percent: completionPct,
          objectives: checks,
          elapsed_seconds: this.world.getElapsedSeconds(),
          remaining: checks.filter(c => !c.met).map(c => c.description),
          message: `${completionPct.toFixed(0)}% complete (${checks.filter(c => c.met).length}/${checks.length} objectives)`,
        };
      }

      case 'submit_result': {
        const checks = this._evaluateObjectives();
        const completionPct = checks.filter(c => c.met).length / checks.length * 100;
        const elapsed = parseFloat(this.world.getElapsedSeconds());
        const timeLimit = this.taskConfig.timeLimit || 120;

        // Calculate score
        const scoring = this.taskConfig.scoring || { completion: 50, speed: 30, safety: 20 };
        const completionScore = (completionPct / 100) * scoring.completion;
        const speedScore = elapsed < timeLimit ? ((timeLimit - elapsed) / timeLimit) * scoring.speed : 0;
        const safetyScore = scoring.safety; // Full safety unless violations

        const totalScore = Math.round(completionScore + speedScore + safetyScore);

        const result = {
          score: totalScore,
          max_score: 100,
          breakdown: {
            completion: { score: Math.round(completionScore), max: scoring.completion, detail: `${completionPct.toFixed(0)}% objectives met` },
            speed: { score: Math.round(speedScore), max: scoring.speed, detail: `${elapsed}s of ${timeLimit}s limit` },
            safety: { score: Math.round(safetyScore), max: scoring.safety, detail: 'No violations' },
          },
          objectives: checks,
          elapsed_seconds: elapsed,
          reasoning: params.reasoning,
          grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : totalScore >= 60 ? 'D' : 'F',
        };

        this.submissions.push(result);
        return {
          success: true,
          ...result,
          message: `Final Score: ${totalScore}/100 (Grade: ${result.grade})`,
        };
      }

      case 'report_metric': {
        this.customMetrics[params.name] = params.value;
        return {
          success: true,
          message: `Recorded metric: ${params.name} = ${params.value}`,
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  _evaluateObjectives() {
    const objectives = this.taskConfig.objectives || [];
    return objectives.map(obj => {
      let met = false;
      switch (obj.type) {
        case 'object_in_zone': {
          const zone = this.world.targetZones.find(z => z.id === obj.zoneId);
          met = zone ? zone.fulfilled : false;
          break;
        }
        case 'object_grabbed': {
          const robot = this.world.robot;
          met = robot && robot.grippedObject?.id === obj.objectId;
          break;
        }
        case 'data_extracted': {
          // Check if web data was used (tracked via events)
          met = this.world.events.some(e => e.type === 'web_data_used');
          break;
        }
        case 'all_zones_filled': {
          met = this.world.targetZones.every(z => z.fulfilled);
          break;
        }
        default:
          met = false;
      }
      return { id: obj.id, description: obj.description, type: obj.type, met };
    });
  }

  getLastSubmission() {
    return this.submissions[this.submissions.length - 1] || null;
  }
}
