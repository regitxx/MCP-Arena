// MCP Arena — Runtime Actuation Server
// Safe robot action commands: gestures, display, audio
// Enumerated safe actions ONLY — no free-form motor control
// Demo: logs to console / updates UI. Real: sends to ROS/MQTT

export class MCPActuationServer {
  constructor() {
    this.name = 'mcp-actuation';
    this.description = 'Safe robot action commands (gestures, display, audio)';
    this.actionLog = [];
    this.currentState = {
      gesture: 'neutral',
      display: '',
      volume: 0.7,
      musicPlaying: false,
    };
  }

  // Enumerated safe gestures — no arbitrary motor commands
  static SAFE_GESTURES = [
    'wave', 'nod', 'head_tilt', 'lean_forward', 'lean_back',
    'look_at_user', 'look_away_gentle', 'blink', 'smile',
    'concerned_expression', 'thinking', 'listening', 'neutral',
  ];

  getTools() {
    return [
      {
        name: 'gesture',
        description: 'Execute a safe, pre-defined gesture',
        inputSchema: {
          type: 'object',
          properties: {
            gesture: {
              type: 'string',
              enum: MCPActuationServer.SAFE_GESTURES,
              description: 'Pre-defined gesture to execute',
            },
            intensity: { type: 'number', minimum: 0, maximum: 1, default: 0.7 },
            duration: { type: 'number', minimum: 0.5, maximum: 5, default: 2, description: 'Duration in seconds' },
          },
          required: ['gesture'],
        },
      },
      {
        name: 'display_text',
        description: 'Show text on the robot display/screen',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to display' },
            size: { type: 'string', enum: ['small', 'medium', 'large'], default: 'medium' },
            duration: { type: 'number', default: 5, description: 'Display duration in seconds' },
            emoji: { type: 'string', description: 'Optional emoji to display alongside' },
          },
          required: ['text'],
        },
      },
      {
        name: 'play_music',
        description: 'Play background music or ambient sounds',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: ['calming', 'upbeat', 'nature', 'classical', 'cantonese_oldies', 'ambient'], default: 'calming' },
            volume: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
            action: { type: 'string', enum: ['play', 'pause', 'stop'], default: 'play' },
          },
        },
      },
      {
        name: 'adjust_volume',
        description: 'Adjust the robot speech/audio volume',
        inputSchema: {
          type: 'object',
          properties: {
            volume: { type: 'number', minimum: 0, maximum: 1, description: 'Volume level (0-1)' },
          },
          required: ['volume'],
        },
      },
      {
        name: 'get_action_log',
        description: 'Get recent action history',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
          },
        },
      },
      {
        name: 'get_current_state',
        description: 'Get current robot physical state',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'gesture': {
        if (!MCPActuationServer.SAFE_GESTURES.includes(params.gesture)) {
          return { error: `Unsafe gesture: ${params.gesture}. Allowed: ${MCPActuationServer.SAFE_GESTURES.join(', ')}` };
        }
        const action = {
          type: 'gesture',
          gesture: params.gesture,
          intensity: params.intensity || 0.7,
          duration: params.duration || 2,
          timestamp: Date.now(),
        };
        this.actionLog.push(action);
        this.currentState.gesture = params.gesture;
        console.log(`[ACTUATION] Gesture: ${params.gesture} (intensity: ${action.intensity})`);
        return { executed: true, ...action, mode: 'demo' };
      }

      case 'display_text': {
        const action = {
          type: 'display',
          text: params.text,
          size: params.size || 'medium',
          duration: params.duration || 5,
          emoji: params.emoji || null,
          timestamp: Date.now(),
        };
        this.actionLog.push(action);
        this.currentState.display = params.text;
        console.log(`[ACTUATION] Display: "${params.text}" ${params.emoji || ''}`);
        return { displayed: true, ...action, mode: 'demo' };
      }

      case 'play_music': {
        const action = {
          type: 'music',
          category: params.category || 'calming',
          volume: params.volume || 0.5,
          action: params.action || 'play',
          timestamp: Date.now(),
        };
        this.actionLog.push(action);
        this.currentState.musicPlaying = params.action !== 'stop';
        console.log(`[ACTUATION] Music: ${action.action} ${action.category} (vol: ${action.volume})`);
        return { ...action, mode: 'demo' };
      }

      case 'adjust_volume': {
        const vol = Math.min(1, Math.max(0, params.volume));
        this.currentState.volume = vol;
        this.actionLog.push({ type: 'volume', volume: vol, timestamp: Date.now() });
        return { volume: vol, adjusted: true, mode: 'demo' };
      }

      case 'get_action_log': {
        return {
          actions: this.actionLog.slice(-(params.limit || 20)),
          total: this.actionLog.length,
        };
      }

      case 'get_current_state': {
        return { ...this.currentState };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }
}
