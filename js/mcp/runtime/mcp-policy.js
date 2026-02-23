// MCP Arena — Runtime Policy Server
// MCP server wrapping the PolicyEngine for safety constraint evaluation
// Tools: classify_risk, check_output, get_allowed_actions, requires_escalation, get_violations

import { PolicyEngine } from '../../brain/policy-engine.js';

export class MCPPolicyServer {
  constructor() {
    this.name = 'mcp-policy';
    this.description = 'Safety constraint evaluation and enforcement';
    this.engine = new PolicyEngine();
  }

  getTools() {
    return [
      {
        name: 'classify_risk',
        description: 'Classify the risk level of user input before processing',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'User input text to classify' },
            userId: { type: 'string' },
            timeOfDay: { type: 'number', description: 'Hour of day (0-23) for sundowning detection' },
          },
          required: ['text'],
        },
      },
      {
        name: 'check_output',
        description: 'Check and filter LLM output for safety before returning to user',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'LLM response text to check' },
            userId: { type: 'string' },
            userEmotion: { type: 'string', description: 'Detected user emotion for context' },
            inputRisk: { type: 'string', description: 'Risk level from classify_risk' },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_allowed_actions',
        description: 'Check which actions are permitted in the current context',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'The action to check (e.g., "health_discussion", "contact_emergency")' },
            userId: { type: 'string' },
          },
          required: ['action'],
        },
      },
      {
        name: 'requires_escalation',
        description: 'Check if the current situation requires caregiver escalation',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to check for escalation triggers' },
            userId: { type: 'string' },
            context: { type: 'string', description: 'Additional context (JSON)' },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_violations',
        description: 'Get recent policy violation history',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
          },
        },
      },
      {
        name: 'get_escalations',
        description: 'Get escalation history for review',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'classify_risk': {
        const context = {
          userId: params.userId,
          timeOfDay: params.timeOfDay ?? new Date().getHours(),
        };
        const result = this.engine.classifyRisk(params.text, context);
        return {
          ...result,
          timestamp: new Date().toISOString(),
          inputLength: params.text.length,
        };
      }

      case 'check_output': {
        const context = {
          userId: params.userId,
          userEmotion: params.userEmotion,
          inputRisk: params.inputRisk,
        };
        const result = this.engine.evaluateOutput(params.text, context);
        return {
          ...result,
          timestamp: new Date().toISOString(),
        };
      }

      case 'get_allowed_actions': {
        return this.engine.isActionAllowed(params.action, { userId: params.userId });
      }

      case 'requires_escalation': {
        const risk = this.engine.classifyRisk(params.text, { userId: params.userId });
        return {
          requiresEscalation: risk.requiresEscalation,
          risk: risk.risk,
          flags: risk.flags.filter(f => f.action === 'ESCALATE'),
          recommendation: risk.requiresEscalation
            ? 'Immediate caregiver notification recommended'
            : 'No escalation required',
        };
      }

      case 'get_violations': {
        return {
          violations: this.engine.getViolationHistory(params.limit || 20),
          total: this.engine.violations.length,
        };
      }

      case 'get_escalations': {
        return {
          escalations: this.engine.getEscalationHistory(),
          total: this.engine.escalations.length,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }
}
