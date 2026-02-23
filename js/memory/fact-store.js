// MCP Arena — Fact Store
// IndexedDB-backed persistent memory for the social robot brain
// Falls back to in-memory Map when IndexedDB is unavailable (Node.js)

import { mergeFacts } from './fact-schema.js';

const DB_NAME = 'mcp-arena-memory';
const DB_VERSION = 1;
const STORES = {
  FACTS: 'facts',
  TURNS: 'turns',
  EMOTIONS: 'emotions',
};

export class FactStore {
  constructor() {
    this.db = null;
    this.fallback = {
      facts: new Map(),
      turns: new Map(),
      emotions: new Map(),
    };
    this.useIndexedDB = typeof indexedDB !== 'undefined';
  }

  /**
   * Initialize the store (open IndexedDB or use fallback)
   */
  async init() {
    if (!this.useIndexedDB) {
      console.log('[FactStore] IndexedDB unavailable, using in-memory fallback');
      return;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Facts store with indexes
        if (!db.objectStoreNames.contains(STORES.FACTS)) {
          const factStore = db.createObjectStore(STORES.FACTS, { keyPath: 'id' });
          factStore.createIndex('userId', 'userId', { unique: false });
          factStore.createIndex('type', 'type', { unique: false });
          factStore.createIndex('userId_type', ['userId', 'type'], { unique: false });
          factStore.createIndex('createdAt', 'createdAt', { unique: false });
          factStore.createIndex('tags', 'tags', { multiEntry: true });
        }

        // Turns store
        if (!db.objectStoreNames.contains(STORES.TURNS)) {
          const turnStore = db.createObjectStore(STORES.TURNS, { keyPath: 'id' });
          turnStore.createIndex('userId', 'userId', { unique: false });
          turnStore.createIndex('timestamp', 'timestamp', { unique: false });
          turnStore.createIndex('userId_timestamp', ['userId', 'timestamp'], { unique: false });
        }

        // Emotions store
        if (!db.objectStoreNames.contains(STORES.EMOTIONS)) {
          const emotionStore = db.createObjectStore(STORES.EMOTIONS, { keyPath: 'id' });
          emotionStore.createIndex('userId', 'userId', { unique: false });
          emotionStore.createIndex('timestamp', 'timestamp', { unique: false });
          emotionStore.createIndex('userId_emotion', ['userId', 'emotion'], { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[FactStore] IndexedDB ready');
        resolve();
      };

      request.onerror = (event) => {
        console.warn('[FactStore] IndexedDB failed, using fallback:', event.target.error);
        this.useIndexedDB = false;
        resolve(); // Don't reject — fallback works
      };
    });
  }

  // ═══════════════════════════════════════════
  // FACT CRUD
  // ═══════════════════════════════════════════

  /**
   * Store a new fact (or merge with existing if content overlaps)
   */
  async storeFact(fact) {
    // Check for existing similar fact
    const existing = await this.findSimilarFact(fact.userId, fact.type, fact.content);
    if (existing) {
      const merged = mergeFacts(existing, fact);
      return this._put(STORES.FACTS, merged);
    }
    return this._put(STORES.FACTS, fact);
  }

  /**
   * Retrieve facts matching a query
   * @param {Object} query — { userId, type?, tags?, keyword?, limit?, since? }
   */
  async retrieveFacts(query) {
    const { userId, type, tags, keyword, limit = 50, since } = query;
    let results;

    if (this.useIndexedDB && this.db) {
      if (type) {
        results = await this._getByIndex(STORES.FACTS, 'userId_type', [userId, type]);
      } else {
        results = await this._getByIndex(STORES.FACTS, 'userId', userId);
      }
    } else {
      results = [...this.fallback.facts.values()].filter(f => f.userId === userId);
      if (type) results = results.filter(f => f.type === type);
    }

    // Apply filters
    if (tags && tags.length > 0) {
      results = results.filter(f => tags.some(t => f.tags.includes(t)));
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      results = results.filter(f => f.content.toLowerCase().includes(kw));
    }
    if (since) {
      results = results.filter(f => f.createdAt >= since);
    }

    // Check expiry
    const now = Date.now();
    results = results.filter(f => !f.expiresAt || f.expiresAt > now);

    // Sort by confidence (desc) then recency (desc)
    results.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.createdAt - a.createdAt;
    });

    // Update access counts
    for (const fact of results.slice(0, limit)) {
      fact.accessCount = (fact.accessCount || 0) + 1;
      fact.lastAccessedAt = now;
      this._put(STORES.FACTS, fact); // fire-and-forget update
    }

    return results.slice(0, limit);
  }

  /**
   * Get a user's profile as a structured summary
   */
  async getProfile(userId) {
    const allFacts = await this.retrieveFacts({ userId, limit: 200 });
    const profile = {
      userId,
      factCount: allFacts.length,
      lastUpdated: allFacts.length > 0 ? Math.max(...allFacts.map(f => f.updatedAt)) : null,
      byType: {},
      topTags: [],
      emotionalProfile: { dominant: null, averageValence: 0 },
    };

    // Group by type
    for (const fact of allFacts) {
      if (!profile.byType[fact.type]) profile.byType[fact.type] = [];
      profile.byType[fact.type].push({
        content: fact.content,
        confidence: fact.confidence,
        source: fact.source,
        valence: fact.emotionalValence,
      });
    }

    // Count tags
    const tagCounts = {};
    for (const fact of allFacts) {
      for (const tag of fact.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    profile.topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Emotional profile from emotional facts
    const emotionalFacts = allFacts.filter(f => f.type === 'emotional');
    if (emotionalFacts.length > 0) {
      const valenceMap = { positive: 1, neutral: 0, negative: -1, mixed: 0 };
      const avgValence = emotionalFacts.reduce((sum, f) => sum + (valenceMap[f.emotionalValence] || 0), 0) / emotionalFacts.length;
      profile.emotionalProfile.averageValence = Math.round(avgValence * 100) / 100;
      // Most frequent emotional content
      const emotionCounts = {};
      for (const f of emotionalFacts) {
        emotionCounts[f.content] = (emotionCounts[f.content] || 0) + 1;
      }
      const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) profile.emotionalProfile.dominant = sorted[0][0];
    }

    return profile;
  }

  /**
   * Delete a specific fact by ID
   */
  async deleteFact(factId) {
    return this._delete(STORES.FACTS, factId);
  }

  // ═══════════════════════════════════════════
  // CONVERSATION TURNS
  // ═══════════════════════════════════════════

  async storeTurn(turn) {
    return this._put(STORES.TURNS, turn);
  }

  async getRecentTurns(userId, limit = 10) {
    let results;
    if (this.useIndexedDB && this.db) {
      results = await this._getByIndex(STORES.TURNS, 'userId', userId);
    } else {
      results = [...this.fallback.turns.values()].filter(t => t.userId === userId);
    }
    results.sort((a, b) => b.timestamp - a.timestamp);
    return results.slice(0, limit).reverse(); // chronological order
  }

  // ═══════════════════════════════════════════
  // EMOTION TIMELINE
  // ═══════════════════════════════════════════

  async storeEmotion(reading) {
    return this._put(STORES.EMOTIONS, reading);
  }

  async getEmotionTimeline(userId, days = 7) {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    let results;
    if (this.useIndexedDB && this.db) {
      results = await this._getByIndex(STORES.EMOTIONS, 'userId', userId);
    } else {
      results = [...this.fallback.emotions.values()].filter(e => e.userId === userId);
    }
    results = results.filter(e => e.timestamp >= since);
    results.sort((a, b) => a.timestamp - b.timestamp);
    return results;
  }

  // ═══════════════════════════════════════════
  // SIMILARITY / DEDUP
  // ═══════════════════════════════════════════

  async findSimilarFact(userId, type, content) {
    const existing = await this.retrieveFacts({ userId, type, limit: 100 });
    const contentLower = content.toLowerCase();
    // Simple similarity: exact match or >70% word overlap
    for (const fact of existing) {
      const factLower = fact.content.toLowerCase();
      if (factLower === contentLower) return fact;
      const contentWords = new Set(contentLower.split(/\s+/));
      const factWords = new Set(factLower.split(/\s+/));
      const overlap = [...contentWords].filter(w => factWords.has(w)).length;
      const similarity = overlap / Math.max(contentWords.size, factWords.size);
      if (similarity > 0.7) return fact;
    }
    return null;
  }

  // ═══════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════

  async getStats(userId) {
    const facts = await this.retrieveFacts({ userId, limit: 1000 });
    const turns = await this.getRecentTurns(userId, 1000);
    const emotions = await this.getEmotionTimeline(userId, 30);
    return {
      totalFacts: facts.length,
      totalTurns: turns.length,
      emotionReadings: emotions.length,
      factTypes: [...new Set(facts.map(f => f.type))],
      oldestFact: facts.length > 0 ? Math.min(...facts.map(f => f.createdAt)) : null,
      newestFact: facts.length > 0 ? Math.max(...facts.map(f => f.createdAt)) : null,
    };
  }

  // ═══════════════════════════════════════════
  // INTERNAL: IndexedDB + Fallback abstraction
  // ═══════════════════════════════════════════

  async _put(storeName, record) {
    if (this.useIndexedDB && this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(record);
        request.onsuccess = () => resolve(record);
        request.onerror = () => reject(request.error);
      });
    }
    this.fallback[storeName].set(record.id, record);
    return record;
  }

  async _delete(storeName, id) {
    if (this.useIndexedDB && this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
    return this.fallback[storeName].delete(id);
  }

  async _getByIndex(storeName, indexName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Wipe all data for a user (for testing / GDPR)
   */
  async clearUser(userId) {
    const facts = await this.retrieveFacts({ userId, limit: 10000 });
    for (const f of facts) await this._delete(STORES.FACTS, f.id);

    const turns = await this.getRecentTurns(userId, 10000);
    for (const t of turns) await this._delete(STORES.TURNS, t.id);

    const emotions = await this.getEmotionTimeline(userId, 365);
    for (const e of emotions) await this._delete(STORES.EMOTIONS, e.id);
  }
}
