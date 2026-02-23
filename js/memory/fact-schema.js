// MCP Arena — Fact Schema
// Structured memory facts with provenance, confidence, and emotional valence

// Fact types for categorizing stored knowledge
export const FACT_TYPES = {
  PERSONAL: 'personal',         // Name, age, family, living situation
  PREFERENCE: 'preference',     // Food, music, activities, topics
  HEALTH: 'health',             // Conditions, medications, mobility
  EMOTIONAL: 'emotional',       // Mood patterns, triggers, coping
  SOCIAL: 'social',             // Relationships, visitors, isolation
  ROUTINE: 'routine',           // Daily schedule, habits, rituals
  MEMORY: 'memory',             // Life stories, reminiscences
  BEHAVIORAL: 'behavioral',     // Conversation patterns, engagement
  CLINICAL: 'clinical',         // Assessment scores, observations
  CONTEXTUAL: 'contextual',     // Time-based, environmental
};

// Source types — where the brain learned this fact
export const FACT_SOURCES = {
  USER_STATED: 'user_stated',           // User directly said it
  INFERRED: 'inferred',                 // Brain deduced from context
  CAREGIVER_INPUT: 'caregiver_input',   // Caregiver provided info
  ASSESSMENT: 'assessment',             // From clinical assessment tool
  OBSERVATION: 'observation',           // Pattern detected over time
  IMPORTED: 'imported',                 // Bulk data import
};

// Emotional valence tags
export const VALENCE = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  MIXED: 'mixed',
};

/**
 * Create a new MemoryFact with full provenance
 * @param {Object} params
 * @returns {Object} A structured MemoryFact
 */
export function createFact({
  userId,
  type,
  content,
  source = FACT_SOURCES.INFERRED,
  confidence = 0.7,
  tags = [],
  emotionalValence = VALENCE.NEUTRAL,
  relatedFactIds = [],
  expiresAt = null,
  metadata = {},
}) {
  if (!userId || !type || !content) {
    throw new Error('MemoryFact requires userId, type, and content');
  }
  if (!Object.values(FACT_TYPES).includes(type)) {
    throw new Error(`Invalid fact type: ${type}. Must be one of: ${Object.values(FACT_TYPES).join(', ')}`);
  }
  if (confidence < 0 || confidence > 1) {
    throw new Error('Confidence must be between 0 and 1');
  }

  return {
    id: generateFactId(),
    userId,
    type,
    content: typeof content === 'string' ? content : JSON.stringify(content),
    source,
    confidence: Math.round(confidence * 100) / 100,
    emotionalValence,
    tags: Array.isArray(tags) ? tags : [tags],
    relatedFactIds,
    expiresAt,
    metadata,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    accessCount: 0,
    lastAccessedAt: null,
    version: 1,
  };
}

/**
 * Create a conversation turn record
 */
export function createTurnRecord({
  userId,
  turnNumber,
  userMessage,
  botResponse,
  detectedEmotion = null,
  detectedIntent = null,
  modelUsed = null,
  latencyMs = null,
  policyChecks = [],
  mcpToolsCalled = [],
  factsRetrieved = [],
  factsStored = [],
}) {
  return {
    id: generateFactId(),
    userId,
    turnNumber,
    userMessage,
    botResponse,
    detectedEmotion,
    detectedIntent,
    modelUsed,
    latencyMs,
    policyChecks,
    mcpToolsCalled,
    factsRetrieved,
    factsStored,
    timestamp: Date.now(),
  };
}

/**
 * Create an emotion reading for the timeline
 */
export function createEmotionReading({
  userId,
  emotion,
  intensity = 0.5,
  source = 'conversation',
  trigger = null,
  context = {},
}) {
  return {
    id: generateFactId(),
    userId,
    emotion,
    intensity: Math.round(Math.min(1, Math.max(0, intensity)) * 100) / 100,
    source,
    trigger,
    context,
    timestamp: Date.now(),
  };
}

/**
 * Merge two facts (when updating existing knowledge)
 */
export function mergeFacts(existing, update) {
  const merged = { ...existing };
  // Update content if new info is more confident
  if (update.confidence >= existing.confidence) {
    merged.content = update.content;
    merged.source = update.source;
  }
  // Always update confidence to weighted average (favor recent)
  merged.confidence = Math.round(
    (existing.confidence * 0.3 + update.confidence * 0.7) * 100
  ) / 100;
  // Merge tags
  merged.tags = [...new Set([...existing.tags, ...(update.tags || [])])];
  // Update metadata
  merged.metadata = { ...existing.metadata, ...update.metadata };
  merged.updatedAt = Date.now();
  merged.version = (existing.version || 1) + 1;
  return merged;
}

// Simple ID generator (browser-safe, no crypto dependency)
function generateFactId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `fact_${ts}_${rand}`;
}
