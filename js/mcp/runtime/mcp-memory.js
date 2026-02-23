// MCP Arena — Runtime Memory Server
// MCP server wrapping the fact store for structured memory operations
// Tools: store_fact, retrieve_facts, store_turn, get_profile, get_emotion_timeline, search_memory, extract_facts

import { FactStore } from '../../memory/fact-store.js';
import { MemorySearch } from '../../memory/memory-search.js';
import { createFact, createTurnRecord, createEmotionReading, FACT_TYPES, FACT_SOURCES } from '../../memory/fact-schema.js';

export class MCPMemoryServer {
  constructor() {
    this.name = 'mcp-memory';
    this.description = 'Structured persistent memory with provenance tracking';
    this.factStore = new FactStore();
    this.search = new MemorySearch(this.factStore);
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await this.factStore.init();
      this.initialized = true;
    }
  }

  getTools() {
    return [
      {
        name: 'store_fact',
        description: 'Store a new fact about a user with provenance tracking',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User identifier' },
            type: { type: 'string', enum: Object.values(FACT_TYPES), description: 'Fact category' },
            content: { type: 'string', description: 'The fact content' },
            source: { type: 'string', enum: Object.values(FACT_SOURCES), description: 'How this fact was learned' },
            confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence level (0-1)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Searchable tags' },
            emotionalValence: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
          },
          required: ['userId', 'type', 'content'],
        },
      },
      {
        name: 'retrieve_facts',
        description: 'Retrieve stored facts about a user, filtered by type/tags/keyword',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            type: { type: 'string', enum: Object.values(FACT_TYPES) },
            tags: { type: 'array', items: { type: 'string' } },
            keyword: { type: 'string', description: 'Keyword search in content' },
            limit: { type: 'number', default: 20 },
            since: { type: 'number', description: 'Timestamp — only facts after this time' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'store_turn',
        description: 'Store a complete conversation turn with metadata',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            turnNumber: { type: 'number' },
            userMessage: { type: 'string' },
            botResponse: { type: 'string' },
            detectedEmotion: { type: 'string' },
            detectedIntent: { type: 'string' },
            modelUsed: { type: 'string' },
            latencyMs: { type: 'number' },
            policyChecks: { type: 'array', items: { type: 'string' } },
            mcpToolsCalled: { type: 'array', items: { type: 'string' } },
          },
          required: ['userId', 'userMessage', 'botResponse'],
        },
      },
      {
        name: 'get_profile',
        description: 'Get a structured summary of everything known about a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_emotion_timeline',
        description: 'Get the emotion history for a user over N days',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            days: { type: 'number', default: 7, description: 'Number of days to look back' },
          },
          required: ['userId'],
        },
      },
      {
        name: 'search_memory',
        description: 'Intelligent search across all facts using natural language',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            query: { type: 'string', description: 'Natural language search query' },
            limit: { type: 'number', default: 10 },
            recencyBias: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
            types: { type: 'array', items: { type: 'string' }, description: 'Filter to specific fact types' },
          },
          required: ['userId', 'query'],
        },
      },
      {
        name: 'store_emotion',
        description: 'Record an emotion reading for the timeline',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            emotion: { type: 'string' },
            intensity: { type: 'number', minimum: 0, maximum: 1 },
            source: { type: 'string', default: 'conversation' },
            trigger: { type: 'string', description: 'What caused this emotion' },
          },
          required: ['userId', 'emotion'],
        },
      },
      {
        name: 'get_context_for_turn',
        description: 'Get all relevant context for processing a conversation turn',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            userMessage: { type: 'string', description: 'The current user message' },
          },
          required: ['userId', 'userMessage'],
        },
      },
      {
        name: 'get_recent_turns',
        description: 'Get recent conversation turns for history',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            limit: { type: 'number', default: 10 },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_stats',
        description: 'Get memory statistics for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
      },
    ];
  }

  async executeTool(toolName, params) {
    await this.init();

    switch (toolName) {
      case 'store_fact': {
        const fact = createFact({
          userId: params.userId,
          type: params.type,
          content: params.content,
          source: params.source || 'inferred',
          confidence: params.confidence || 0.7,
          tags: params.tags || [],
          emotionalValence: params.emotionalValence || 'neutral',
        });
        const stored = await this.factStore.storeFact(fact);
        return {
          success: true,
          factId: stored.id,
          merged: stored.version > 1,
          message: stored.version > 1
            ? `Updated existing fact (v${stored.version})`
            : 'New fact stored',
        };
      }

      case 'retrieve_facts': {
        const facts = await this.factStore.retrieveFacts({
          userId: params.userId,
          type: params.type,
          tags: params.tags,
          keyword: params.keyword,
          limit: params.limit || 20,
          since: params.since,
        });
        return {
          count: facts.length,
          facts: facts.map(f => ({
            id: f.id,
            type: f.type,
            content: f.content,
            confidence: f.confidence,
            source: f.source,
            valence: f.emotionalValence,
            tags: f.tags,
            age: this._formatAge(f.createdAt),
          })),
        };
      }

      case 'store_turn': {
        const turn = createTurnRecord({
          userId: params.userId,
          turnNumber: params.turnNumber || 0,
          userMessage: params.userMessage,
          botResponse: params.botResponse,
          detectedEmotion: params.detectedEmotion,
          detectedIntent: params.detectedIntent,
          modelUsed: params.modelUsed,
          latencyMs: params.latencyMs,
          policyChecks: params.policyChecks || [],
          mcpToolsCalled: params.mcpToolsCalled || [],
        });
        await this.factStore.storeTurn(turn);

        // Auto-extract facts from the turn
        const candidates = this.search.extractFactCandidates(
          params.userMessage,
          params.botResponse,
          params.detectedEmotion ? { emotion: params.detectedEmotion } : null
        );
        const storedFacts = [];
        for (const c of candidates) {
          const fact = createFact({
            userId: params.userId,
            ...c,
          });
          const stored = await this.factStore.storeFact(fact);
          storedFacts.push(stored.id);
        }

        return {
          turnId: turn.id,
          factsExtracted: storedFacts.length,
          factIds: storedFacts,
        };
      }

      case 'get_profile': {
        return await this.factStore.getProfile(params.userId);
      }

      case 'get_emotion_timeline': {
        const timeline = await this.factStore.getEmotionTimeline(
          params.userId,
          params.days || 7
        );
        return {
          userId: params.userId,
          days: params.days || 7,
          readings: timeline.length,
          timeline: timeline.map(e => ({
            emotion: e.emotion,
            intensity: e.intensity,
            source: e.source,
            trigger: e.trigger,
            time: new Date(e.timestamp).toISOString(),
          })),
          summary: this._summarizeEmotions(timeline),
        };
      }

      case 'search_memory': {
        const results = await this.search.search(
          params.userId,
          params.query,
          {
            limit: params.limit || 10,
            recencyBias: params.recencyBias || 0.3,
            types: params.types,
          }
        );
        return {
          query: params.query,
          count: results.length,
          results: results.map(f => ({
            id: f.id,
            type: f.type,
            content: f.content,
            confidence: f.confidence,
            score: f._searchScore,
            relevance: f._relevance,
            recency: f._recency,
          })),
        };
      }

      case 'store_emotion': {
        const reading = createEmotionReading({
          userId: params.userId,
          emotion: params.emotion,
          intensity: params.intensity || 0.5,
          source: params.source || 'conversation',
          trigger: params.trigger,
        });
        await this.factStore.storeEmotion(reading);
        return { readingId: reading.id, stored: true };
      }

      case 'get_context_for_turn': {
        const recentEmotions = await this.factStore.getEmotionTimeline(params.userId, 1);
        const context = await this.search.getContextForTurn(
          params.userId,
          params.userMessage,
          recentEmotions
        );
        const recentTurns = await this.factStore.getRecentTurns(params.userId, 5);
        return {
          ...context,
          recentTurns: recentTurns.map(t => ({
            user: t.userMessage,
            bot: t.botResponse,
            emotion: t.detectedEmotion,
            time: new Date(t.timestamp).toISOString(),
          })),
        };
      }

      case 'get_recent_turns': {
        const turns = await this.factStore.getRecentTurns(
          params.userId,
          params.limit || 10
        );
        return {
          count: turns.length,
          turns: turns.map(t => ({
            turnNumber: t.turnNumber,
            user: t.userMessage,
            bot: t.botResponse,
            emotion: t.detectedEmotion,
            intent: t.detectedIntent,
            model: t.modelUsed,
            latency: t.latencyMs,
            time: new Date(t.timestamp).toISOString(),
          })),
        };
      }

      case 'get_stats': {
        return await this.factStore.getStats(params.userId);
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  _formatAge(timestamp) {
    const ms = Date.now() - timestamp;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  _summarizeEmotions(timeline) {
    if (timeline.length === 0) return { dominant: 'unknown', trend: 'neutral', volatility: 0 };

    const counts = {};
    let totalIntensity = 0;
    for (const e of timeline) {
      counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      totalIntensity += e.intensity;
    }
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const avgIntensity = totalIntensity / timeline.length;

    // Compute trend from last 5 readings
    const recent = timeline.slice(-5);
    let trend = 'stable';
    if (recent.length >= 3) {
      const positiveEmotions = ['joy', 'gratitude', 'contentment', 'amusement', 'love'];
      const recentPositive = recent.filter(e => positiveEmotions.includes(e.emotion)).length;
      if (recentPositive >= 4) trend = 'improving';
      else if (recentPositive <= 1) trend = 'declining';
    }

    // Volatility: how much emotions change
    let changes = 0;
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].emotion !== timeline[i - 1].emotion) changes++;
    }
    const volatility = timeline.length > 1 ? Math.round(changes / (timeline.length - 1) * 100) / 100 : 0;

    return { dominant, trend, avgIntensity: Math.round(avgIntensity * 100) / 100, volatility };
  }
}
