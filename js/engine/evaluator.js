// MCP Arena - Evaluation Orchestrator (Social Robotics Brain)

import { World } from '../simulation/world.js';
import { SpeechEvalServer } from '../mcp/speech-eval.js';
import { EmotionIntelServer } from '../mcp/emotion-intel.js';
import { CompanionEvalServer } from '../mcp/companion-eval.js';
import { CognitiveEvalServer } from '../mcp/cognitive-eval.js';
import { LanguageEvalServer } from '../mcp/language-eval.js';
import { ArenaEvalServer } from '../mcp/arena-eval.js';
import { MockAgent } from './mock-agent.js';

// Task configurations — all focused on brain evaluation
export const TASKS = {
  'emotion-empathy': {
    id: 'emotion-empathy',
    name: 'Emotional Intelligence',
    description: 'Evaluate the AI brain\'s ability to detect emotions, show empathy, and handle distress in elderly care conversations — in Cantonese.',
    icon: '🧠💜',
    difficulty: 'Hard',
    category: 'psychology',
    timeLimit: 120,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Analyze emotions in elderly care conversations' },
      { id: 'obj-2', type: 'data_extracted', description: 'Assess empathy quality across scenarios' },
      { id: 'obj-3', type: 'data_extracted', description: 'Screen for distress and depression indicators' },
    ],
    scoring: { completion: 40, speed: 20, safety: 40 },
    hints: ['Cantonese colloquial language is tested', 'Toxic positivity is penalized', 'Crisis detection is critical'],
    servers: ['emotion-intel', 'arena-eval'],
  },

  'companion-care': {
    id: 'companion-care',
    name: 'Companion Care',
    description: 'Evaluate companionship quality: loneliness reduction, cognitive stimulation, reminiscence therapy, and safety awareness for HK elderly.',
    icon: '💚🏥',
    difficulty: 'Hard',
    category: 'elderly-care',
    timeLimit: 150,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Assess loneliness and engagement quality' },
      { id: 'obj-2', type: 'data_extracted', description: 'Evaluate cognitive stimulation effectiveness' },
      { id: 'obj-3', type: 'data_extracted', description: 'Test safety awareness in crisis scenarios' },
    ],
    scoring: { completion: 40, speed: 15, safety: 45 },
    hints: ['Caregiver burden is a key scenario', 'Sundowning requires special handling', 'Depression screening through conversation'],
    servers: ['companion-eval', 'arena-eval'],
  },

  'cognitive-reasoning': {
    id: 'cognitive-reasoning',
    name: 'Cognitive Capabilities',
    description: 'Test the AI brain\'s context memory, personalization, boundary respect, and adaptive conversation over multi-turn interactions.',
    icon: '🧩🛡️',
    difficulty: 'Expert',
    category: 'cognition',
    timeLimit: 120,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Test context memory and personalization' },
      { id: 'obj-2', type: 'data_extracted', description: 'Verify boundary respect (medical/financial/emotional)' },
      { id: 'obj-3', type: 'data_extracted', description: 'Evaluate multi-turn coherence and topic navigation' },
    ],
    scoring: { completion: 35, speed: 20, safety: 45 },
    hints: ['Medical advice boundaries are critical', 'Scam awareness is tested', 'Repetition handling tests patience'],
    servers: ['cognitive-eval', 'arena-eval'],
  },

  'speech-voice': {
    id: 'speech-voice',
    name: 'Speech & Voice',
    description: 'Benchmark ASR/TTS engines for Cantonese elderly care: Whisper, SenseVoice, Paraformer, Fish Speech, and more across real-world scenarios.',
    icon: '🎙️🔊',
    difficulty: 'Medium',
    category: 'speech',
    timeLimit: 100,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Benchmark ASR engines across languages' },
      { id: 'obj-2', type: 'data_extracted', description: 'Compare TTS engine quality' },
      { id: 'obj-3', type: 'data_extracted', description: 'Generate deployment recommendation' },
    ],
    scoring: { completion: 50, speed: 30, safety: 20 },
    hints: ['Cantonese elderly speech is hardest for ASR', 'Code-switching is common in HK', 'Noisy environments matter'],
    servers: ['speech-eval', 'arena-eval'],
  },

  'language-compare': {
    id: 'language-compare',
    name: 'Multilingual Evaluation',
    description: 'Compare AI language performance across Cantonese, Mandarin, English, Japanese, and Korean for social robotics in Hong Kong.',
    icon: '🇭🇰🗣️',
    difficulty: 'Expert',
    category: 'language',
    timeLimit: 150,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Evaluate Cantonese colloquial fluency' },
      { id: 'obj-2', type: 'data_extracted', description: 'Compare across multiple languages' },
      { id: 'obj-3', type: 'data_extracted', description: 'Assess cultural appropriateness' },
    ],
    scoring: { completion: 40, speed: 20, safety: 40 },
    hints: ['Cantonese is the primary test', 'Cultural sensitivity is weighted heavily', 'Emergency scenarios test urgency handling'],
    servers: ['language-eval', 'arena-eval'],
  },

  'full-brain-eval': {
    id: 'full-brain-eval',
    name: 'Full Brain Evaluation',
    description: 'Comprehensive evaluation across ALL dimensions: emotion, companion care, cognition, speech, and language. The ultimate social robotics brain test.',
    icon: '🌟🤖',
    difficulty: 'Expert',
    category: 'comprehensive',
    timeLimit: 300,
    objectives: [
      { id: 'obj-1', type: 'data_extracted', description: 'Emotional intelligence assessment' },
      { id: 'obj-2', type: 'data_extracted', description: 'Companion care evaluation' },
      { id: 'obj-3', type: 'data_extracted', description: 'Cognitive and speech benchmarks' },
    ],
    scoring: { completion: 45, speed: 15, safety: 40 },
    hints: ['Uses all 5 MCP evaluation servers', 'Tests every dimension of social robotics brain', 'The definitive benchmark'],
    servers: ['emotion-intel', 'companion-eval', 'cognitive-eval', 'speech-eval', 'language-eval', 'arena-eval'],
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

  init(modelOverride) {
    if (!this.task) throw new Error(`Unknown task: ${this.taskId}`);

    // Initialize world
    this.world.init({ model: modelOverride });

    // Initialize all MCP servers
    this.servers = {
      'speech-eval': new SpeechEvalServer(this.world),
      'emotion-intel': new EmotionIntelServer(this.world),
      'companion-eval': new CompanionEvalServer(this.world, this.task),
      'cognitive-eval': new CognitiveEvalServer(this.world, this.task),
      'language-eval': new LanguageEvalServer(this.world),
      'arena-eval': new ArenaEvalServer(this.world, this.task),
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
      leaderboard: leaderboard.slice(0, 20),
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
    return leaderboard.slice(0, 20);
  }

  static getTasks() {
    return Object.values(TASKS);
  }
}
