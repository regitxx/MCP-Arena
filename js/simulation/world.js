// MCP Arena - Social Robotics Brain World
// Manages evaluation state, events, timing — no physical robot simulation

export class World {
  constructor() {
    this.startTime = null;
    this.events = [];
    this.currentModel = null;
    this.conversationLog = [];
    this.emotionTimeline = [];
    this.metrics = {};
  }

  init(config = {}) {
    this.startTime = Date.now();
    this.events = [];
    this.currentModel = config.model || null;
    this.conversationLog = [];
    this.emotionTimeline = [];
    this.metrics = {};
    this.targetZones = config.targetZones || [];
  }

  getElapsedSeconds() {
    if (!this.startTime) return '0.0';
    return ((Date.now() - this.startTime) / 1000).toFixed(1);
  }

  addEvent(eventOrType, data) {
    // Support both addEvent({ type, ... }) and addEvent('type', { ... })
    if (typeof eventOrType === 'string') {
      this.events.push({ type: eventOrType, ...data, timestamp: Date.now() });
    } else {
      this.events.push({ ...eventOrType, timestamp: Date.now() });
    }
  }

  addConversationTurn(turn) {
    this.conversationLog.push({ ...turn, timestamp: Date.now() });
  }

  addEmotionReading(emotion, intensity, source) {
    this.emotionTimeline.push({ emotion, intensity, source, timestamp: Date.now() });
  }

  setMetric(key, value) {
    this.metrics[key] = value;
  }

  getState() {
    return {
      elapsed: this.getElapsedSeconds(),
      model: this.currentModel,
      eventCount: this.events.length,
      conversationTurns: this.conversationLog.length,
      emotionReadings: this.emotionTimeline.length,
      metrics: { ...this.metrics },
    };
  }
}
