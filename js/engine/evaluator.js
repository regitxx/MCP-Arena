// MCP Arena - Evaluation Orchestrator

import { World } from '../simulation/world.js';
import { SimRobotServer } from '../mcp/sim-robot.js';
import { WebIntelServer } from '../mcp/web-intel.js';
import { ArenaEvalServer } from '../mcp/arena-eval.js';
import { LanguageEvalServer } from '../mcp/language-eval.js';
import { MockAgent } from './mock-agent.js';

// Task configurations
export const TASKS = {
  'web-robot': {
    id: 'web-robot',
    name: 'Web + Robot Coordination',
    description: 'Extract product data from web, then use robot arm to sort the matching physical object into its target zone.',
    icon: '\u{1F916}\u{1F310}',
    difficulty: 'Medium',
    timeLimit: 120,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Extract product data from web catalog' },
      { id: 'obj-2', type: 'object_in_zone', zoneId: 'zone-red', description: 'Place red box in Zone A' },
    ],
    scoring: { completion: 50, speed: 30, safety: 20 },
    hints: ['Start by browsing the product catalog', 'Match product colors to physical objects'],
    worldConfig: {
      robot: { x: 400, y: 420 },
      objects: [
        { id: 'box-red', label: 'RED', x: 150, y: 200, width: 45, height: 45, color: '#ef4444', weight: 1.2 },
        { id: 'box-blue', label: 'BLUE', x: 300, y: 250, width: 40, height: 40, color: '#3b82f6', weight: 0.8 },
        { id: 'box-green', label: 'GRN', x: 500, y: 350, width: 55, height: 55, color: '#22c55e', weight: 3.5 },
      ],
      targetZones: [
        { id: 'zone-red', x: 600, y: 120, width: 80, height: 80, label: 'Zone A (Red)', acceptsId: 'box-red' },
      ],
    },
  },

  'multi-agent': {
    id: 'multi-agent',
    name: 'Multi-Object Sorting',
    description: 'Sort multiple objects into their designated target zones as efficiently as possible.',
    icon: '\u{1F3AD}\u{1F4E6}',
    difficulty: 'Hard',
    timeLimit: 90,
    objectives: [
      { id: 'obj-1', type: 'object_in_zone', zoneId: 'zone-blue', description: 'Place blue box in Zone B' },
      { id: 'obj-2', type: 'object_in_zone', zoneId: 'zone-yellow', description: 'Place yellow box in Zone C' },
      { id: 'obj-3', type: 'all_zones_filled', description: 'All zones fulfilled' },
    ],
    scoring: { completion: 40, speed: 40, safety: 20 },
    hints: ['Plan your route to minimize travel distance', 'Check zones after each placement'],
    worldConfig: {
      robot: { x: 400, y: 420 },
      objects: [
        { id: 'box-blue', label: 'BLUE', x: 300, y: 250, width: 40, height: 40, color: '#3b82f6', weight: 0.8 },
        { id: 'box-yellow', label: 'YLW', x: 500, y: 300, width: 42, height: 42, color: '#eab308', weight: 1.5 },
        { id: 'box-purple', label: 'PRP', x: 200, y: 350, width: 38, height: 38, color: '#a855f7', weight: 0.6 },
      ],
      targetZones: [
        { id: 'zone-blue', x: 200, y: 120, width: 80, height: 80, label: 'Zone B (Blue)', acceptsId: 'box-blue' },
        { id: 'zone-yellow', x: 400, y: 120, width: 80, height: 80, label: 'Zone C (Yellow)', acceptsId: 'box-yellow' },
      ],
    },
  },

  'language-compare': {
    id: 'language-compare',
    name: 'Language Comparison',
    description: 'Evaluate AI agent performance across Cantonese, Mandarin, English, Japanese, and Korean for social robotics in Hong Kong.',
    icon: '\u{1F1ED}\u{1F1F0}\u{1F5E3}',
    difficulty: 'Expert',
    timeLimit: 180,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Evaluate responses in Cantonese (\u5EE3\u6771\u8A71)' },
      { id: 'obj-2', type: 'data_extracted', description: 'Evaluate responses in Mandarin (\u666E\u901A\u8A71)' },
      { id: 'obj-3', type: 'data_extracted', description: 'Compare language performance across scenarios' },
    ],
    scoring: { completion: 40, speed: 20, safety: 40 },
    hints: ['Test greeting, wayfinding, and emergency scenarios', 'Cantonese requires colloquial particles', 'Cultural appropriateness matters as much as fluency'],
    worldConfig: {
      robot: { x: 400, y: 300 },
      objects: [
        { id: 'lang-yue', label: '\u7CB5', x: 150, y: 180, width: 50, height: 50, color: '#ef4444', weight: 1.0, type: 'lang' },
        { id: 'lang-cmn', label: '\u666E', x: 300, y: 180, width: 50, height: 50, color: '#eab308', weight: 1.0, type: 'lang' },
        { id: 'lang-en', label: 'EN', x: 450, y: 180, width: 50, height: 50, color: '#3b82f6', weight: 1.0, type: 'lang' },
        { id: 'lang-ja', label: '\u65E5', x: 600, y: 180, width: 50, height: 50, color: '#22c55e', weight: 1.0, type: 'lang' },
        { id: 'lang-ko', label: '\uD55C', x: 680, y: 180, width: 50, height: 50, color: '#a855f7', weight: 1.0, type: 'lang' },
      ],
      targetZones: [],
    },
  },

  'discovery': {
    id: 'discovery',
    name: 'Skill Discovery',
    description: 'Dropped into unknown environment. Discover available MCP tools, explore the workspace, and complete the sorting task.',
    icon: '\u{1F50D}\u{1F9E0}',
    difficulty: 'Expert',
    timeLimit: 150,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Research objects using web intelligence' },
      { id: 'obj-2', type: 'object_in_zone', zoneId: 'zone-red-d', description: 'Place red box in Zone A' },
      { id: 'obj-3', type: 'object_in_zone', zoneId: 'zone-green-d', description: 'Place green box in Zone B' },
    ],
    scoring: { completion: 45, speed: 25, safety: 30 },
    hints: ['Use arena-eval to understand your task', 'Explore all available MCP servers'],
    worldConfig: {
      robot: { x: 400, y: 420 },
      objects: [
        { id: 'box-red', label: 'RED', x: 150, y: 200, width: 45, height: 45, color: '#ef4444', weight: 1.2 },
        { id: 'box-green', label: 'GRN', x: 500, y: 350, width: 55, height: 55, color: '#22c55e', weight: 3.5 },
        { id: 'box-blue', label: 'BLUE', x: 350, y: 280, width: 40, height: 40, color: '#3b82f6', weight: 0.8 },
      ],
      targetZones: [
        { id: 'zone-red-d', x: 600, y: 120, width: 80, height: 80, label: 'Zone A', acceptsId: 'box-red' },
        { id: 'zone-green-d', x: 650, y: 350, width: 80, height: 80, label: 'Zone B', acceptsId: 'box-green' },
      ],
    },
  },
};

// Leaderboard (in-memory)
const leaderboard = [];

export class Evaluator {
  constructor(taskId, onEvent) {
    this.taskId = taskId;
    this.task = TASKS[taskId];
    this.onEvent = onEvent;
    this.world = new World();
    this.agent = null;
    this.servers = {};
    this.running = false;
  }

  init() {
    if (!this.task) throw new Error(`Unknown task: ${this.taskId}`);

    // Initialize world
    this.world.init(this.task.worldConfig);

    // Initialize MCP servers
    this.servers = {
      'sim-robot': new SimRobotServer(this.world),
      'web-intel': new WebIntelServer(),
      'arena-eval': new ArenaEvalServer(this.world, this.task),
      'language-eval': new LanguageEvalServer(this.world),
    };

    // Create mock agent
    this.agent = new MockAgent(this.taskId, this.servers, (event) => {
      this.onEvent(event);
    });

    return this;
  }

  async run(speedMultiplier = 1) {
    this.running = true;
    this.onEvent({ type: 'eval_start', task: this.task, worldState: this.world.getState() });

    const result = await this.agent.run(speedMultiplier);

    // Get final eval result
    const evalServer = this.servers['arena-eval'];
    const submission = evalServer.getLastSubmission();

    // Add to leaderboard
    if (submission) {
      leaderboard.push({
        model: result.model,
        taskId: this.taskId,
        taskName: this.task.name,
        score: submission.score,
        grade: submission.grade,
        time: result.totalTime,
        toolCalls: result.toolCalls.length,
        timestamp: Date.now(),
      });
      leaderboard.sort((a, b) => b.score - a.score);
    }

    this.running = false;
    this.onEvent({
      type: 'eval_complete',
      submission,
      leaderboard: leaderboard.slice(0, 10),
    });

    return { submission, leaderboard };
  }

  abort() {
    if (this.agent) this.agent.abort();
    this.running = false;
  }

  getWorld() {
    return this.world;
  }

  static getLeaderboard() {
    return leaderboard.slice(0, 10);
  }

  static getTasks() {
    return Object.values(TASKS);
  }
}
