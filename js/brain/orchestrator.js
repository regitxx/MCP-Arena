// MCP Arena — Brain Orchestrator v2
// THE CORE LOOP: processes one conversation turn through the full MCP pipeline
// Now with: version ledger, conversation repair, caregiver feedback, silence detection
// ASR → NLP → Memory → Policy → Repair Check → Model Select → Prompt Build → LLM → Policy Check → Emotion → Store → Snapshot

import { EmotionState } from './emotion-state.js';
import { ContextLoader } from './context-loader.js';
import { ModelSelector } from './model-selector.js';
import { EvalFeedback } from './eval-feedback.js';
import { VersionLedger } from './version-ledger.js';
import { CaregiverFeedback } from './caregiver-feedback.js';
import { ConversationRepair } from './conversation-repair.js';
import { PromptBuilder } from '../llm/prompt-builder.js';
import { LLMClient } from '../llm/llm-client.js';
import { MCPMemoryServer } from '../mcp/runtime/mcp-memory.js';
import { MCPPolicyServer } from '../mcp/runtime/mcp-policy.js';
import { MCPNlpServer } from '../mcp/runtime/mcp-nlp.js';
import { MCPSpeechServer } from '../mcp/runtime/mcp-speech.js';
import { MCPObserveServer } from '../mcp/runtime/mcp-observe.js';
import { MCPCareServer } from '../mcp/runtime/mcp-care.js';
import { MCPActuationServer } from '../mcp/runtime/mcp-actuation.js';

export class BrainOrchestrator {
  constructor() {
    // MCP Servers (all 7 runtime servers)
    this.memoryServer = new MCPMemoryServer();
    this.policyServer = new MCPPolicyServer();
    this.nlpServer = new MCPNlpServer();
    this.speechServer = new MCPSpeechServer();
    this.observeServer = new MCPObserveServer();
    this.careServer = new MCPCareServer();
    this.actuationServer = new MCPActuationServer();

    // Brain components
    this.emotionState = new EmotionState();
    this.contextLoader = new ContextLoader(this.memoryServer);
    this.modelSelector = new ModelSelector();
    this.evalFeedback = new EvalFeedback(this.modelSelector);
    this.promptBuilder = new PromptBuilder();
    this.llmClient = new LLMClient();

    // NEW: Enhancement components
    this.versionLedger = new VersionLedger();
    this.caregiverFeedback = new CaregiverFeedback(this.modelSelector);
    this.conversationRepair = new ConversationRepair();

    // State
    this.turnNumber = 0;
    this.userId = 'default-user';
    this.initialized = false;
    this.mcpLog = [];
    this.listeners = [];

    // Turn history (for repair detection)
    this.previousUserMessage = null;
    this.previousBotResponse = null;
    this.previousEmotion = null;
  }

  /**
   * Initialize the brain (must call before first turn)
   */
  async init(userId = 'default-user') {
    this.userId = userId;
    this.turnNumber = 0;
    await this.memoryServer.init();
    this.emotionState.reset();
    this.initialized = true;

    // Create initial release if none exists
    if (this.versionLedger.getReleases().length === 0) {
      this.versionLedger.createRelease('v1.0-initial', {
        modelRankings: this.modelSelector.getRankings(),
        defaultModel: 'claude-opus-4',
        policyRulesVersion: '1.0',
        promptTemplateVersion: '1.0',
        languagePreference: 'cantonese',
        features: {
          emotionSimulation: true,
          silenceDetection: true,
          conversationRepair: true,
          caregiverFeedback: true,
          autoModelSwap: true,
          sundowningAwareness: true,
        },
      }, 'Initial brain configuration');
      this.versionLedger.activateRelease('v1.0-initial');
    }

    this._emit('brain_init', { userId });
  }

  /**
   * Process one conversation turn
   * THE CORE LOOP v2 — now with repair, versioning, and observation
   */
  async processTurn(userInput, options = {}) {
    if (!this.initialized) await this.init();

    const turnStart = Date.now();
    this.turnNumber++;
    this.mcpLog = [];

    const turnResult = {
      turnNumber: this.turnNumber,
      userInput,
      response: '',
      mcpActivity: [],
      emotionState: null,
      modelUsed: null,
      latencyMs: 0,
      policyResult: null,
      repairApplied: false,
      snapshotId: null,
    };

    try {
      // ── STEP 1: Record interaction for silence detection ────
      this._logMcp('mcp-observe', 'record_interaction', 'start');
      await this.observeServer.executeTool('record_interaction', { userId: this.userId });
      this._logMcp('mcp-observe', 'record_interaction', 'complete');

      // ── STEP 2: Parse Intent (mcp-nlp) ──────────────────────
      this._logMcp('mcp-nlp', 'parse_intent', 'start');
      const intentResult = await this.nlpServer.executeTool('parse_intent', {
        text: userInput,
        language: options.language || 'auto',
      });
      this._logMcp('mcp-nlp', 'parse_intent', 'complete', intentResult);

      // ── STEP 3: Detect Emotion (mcp-nlp) ─────────────────────
      this._logMcp('mcp-nlp', 'detect_emotion', 'start');
      const emotionResult = await this.nlpServer.executeTool('detect_emotion', {
        text: userInput,
        language: options.language || 'auto',
      });
      this._logMcp('mcp-nlp', 'detect_emotion', 'complete', emotionResult);

      // ── STEP 4: Detect Language (mcp-nlp) ─────────────────────
      this._logMcp('mcp-nlp', 'detect_language', 'start');
      const langResult = await this.nlpServer.executeTool('detect_language', {
        text: userInput,
      });
      this._logMcp('mcp-nlp', 'detect_language', 'complete', langResult);

      // ── STEP 5: Classify Risk (mcp-policy) ────────────────────
      this._logMcp('mcp-policy', 'classify_risk', 'start');
      const riskResult = await this.policyServer.executeTool('classify_risk', {
        text: userInput,
        userId: this.userId,
        timeOfDay: new Date().getHours(),
      });
      this._logMcp('mcp-policy', 'classify_risk', 'complete', riskResult);
      turnResult.policyResult = riskResult;

      // ── STEP 6: Load Context (mcp-memory) ─────────────────────
      this._logMcp('mcp-memory', 'get_context_for_turn', 'start');
      const context = await this.contextLoader.loadForTurn(this.userId, userInput);
      this._logMcp('mcp-memory', 'get_context_for_turn', 'complete', {
        factsLoaded: context.totalFactsAvailable,
        turnsLoaded: context.recentTurns.length,
      });

      // ── STEP 7: Conversation Repair Check ─────────────────────
      this._logMcp('brain', 'conversation_repair', 'start');
      const repairCheck = this.conversationRepair.check({
        userMessage: userInput,
        previousBotResponse: this.previousBotResponse,
        previousUserMessage: this.previousUserMessage,
        userEmotion: emotionResult.primaryEmotion?.emotion,
        previousEmotion: this.previousEmotion,
        turnNumber: this.turnNumber,
        recentTurns: context.recentTurns,
      });
      this._logMcp('brain', 'conversation_repair', 'complete', {
        needsRepair: repairCheck.needsRepair,
        type: repairCheck.type,
      });
      turnResult.repairApplied = repairCheck.needsRepair;

      // ── STEP 8: Select Model ──────────────────────────────────
      const taskType = this.modelSelector.intentToTaskType(
        intentResult.primaryIntent?.intent,
        langResult.primary
      );
      const modelSelection = this.modelSelector.pickBest(taskType, {
        preferredLanguage: langResult.primary,
      });
      turnResult.modelUsed = modelSelection.modelId;
      this._emit('model_selected', modelSelection);

      // ── STEP 9: Update Emotion State ──────────────────────────
      const emotionUpdate = this.emotionState.update({
        userEmotion: emotionResult.primaryEmotion?.emotion,
        userEmotionIntensity: emotionResult.primaryEmotion?.intensity,
        timeOfDay: new Date().getHours(),
        turnNumber: this.turnNumber,
        policyFlags: riskResult.flags || [],
      });
      turnResult.emotionState = emotionUpdate;

      // ── STEP 10: Build Prompt (with repair injection) ──────────
      const emotionInjection = this.emotionState.getSystemPromptInjection();
      const repairInjection = repairCheck.needsRepair
        ? this.conversationRepair.getRepairPromptInjection(repairCheck)
        : '';
      const policyConstraints = (riskResult.flags || []).map(f => f.ruleName);

      // Apply any pending caregiver feedback adjustments
      const feedbackInstructions = this.caregiverFeedback.applyPendingAdjustments();
      const feedbackConstraints = feedbackInstructions
        .filter(i => i.target === 'prompt_builder')
        .map(i => i.constraint);

      const systemPrompt = this.promptBuilder.build({
        emotionInjection: emotionInjection + (repairInjection ? '\n\n' + repairInjection : ''),
        userProfile: context.profile,
        policyConstraints: [...policyConstraints, ...feedbackConstraints],
        recentTurns: context.recentTurns,
        contextFacts: context.contextFacts,
        language: langResult.primary,
        timeOfDay: new Date().getHours(),
      });

      // ── STEP 11: Call LLM ──────────────────────────────────────
      this._logMcp('llm', modelSelection.modelId, 'start');
      const messages = [
        ...context.recentTurns.map(t => [
          { role: 'user', content: t.user || t.userMessage },
          { role: 'assistant', content: t.bot || t.botResponse },
        ]).flat(),
        { role: 'user', content: userInput },
      ];

      const llmResult = await this.llmClient.call(
        modelSelection.modelId,
        systemPrompt,
        messages,
        { temperature: 0.7, maxTokens: 512 }
      );
      this._logMcp('llm', modelSelection.modelId, 'complete', {
        latencyMs: llmResult.latencyMs,
        mode: llmResult.mode,
      });

      // ── STEP 12: Check Output Safety (mcp-policy) ─────────────
      this._logMcp('mcp-policy', 'check_output', 'start');
      const outputCheck = await this.policyServer.executeTool('check_output', {
        text: llmResult.response,
        userId: this.userId,
        userEmotion: emotionResult.primaryEmotion?.emotion,
        inputRisk: riskResult.risk,
      });
      this._logMcp('mcp-policy', 'check_output', 'complete', {
        safe: outputCheck.safe,
        violations: outputCheck.violations?.length || 0,
      });

      // Use filtered output
      turnResult.response = outputCheck.output || llmResult.response;

      // ── STEP 13: Ingest health signals (mcp-observe) ───────────
      if (emotionResult.needsSupport) {
        this._logMcp('mcp-observe', 'ingest_signal', 'start');
        await this.observeServer.executeTool('ingest_signal', {
          userId: this.userId,
          signalType: 'mood',
          value: emotionResult.primaryEmotion?.emotion || 'unknown',
          severity: emotionResult.primaryEmotion?.intensity || 0.5,
        });
        this._logMcp('mcp-observe', 'ingest_signal', 'complete');
      }

      // ── STEP 14: Store Emotion Reading (mcp-memory) ────────────
      this._logMcp('mcp-memory', 'store_emotion', 'start');
      await this.memoryServer.executeTool('store_emotion', {
        userId: this.userId,
        emotion: emotionResult.primaryEmotion?.emotion || 'neutral',
        intensity: emotionResult.primaryEmotion?.intensity || 0.3,
        source: 'conversation',
        trigger: userInput.substring(0, 100),
      });
      this._logMcp('mcp-memory', 'store_emotion', 'complete');

      // ── STEP 15: Store Turn (mcp-memory) ───────────────────────
      this._logMcp('mcp-memory', 'store_turn', 'start');
      const turnStore = await this.memoryServer.executeTool('store_turn', {
        userId: this.userId,
        turnNumber: this.turnNumber,
        userMessage: userInput,
        botResponse: turnResult.response,
        detectedEmotion: emotionResult.primaryEmotion?.emotion,
        detectedIntent: intentResult.primaryIntent?.intent,
        modelUsed: modelSelection.modelId,
        latencyMs: llmResult.latencyMs,
        policyChecks: (riskResult.flags || []).map(f => f.ruleId),
        mcpToolsCalled: this.mcpLog.map(l => l.tool),
      });
      this._logMcp('mcp-memory', 'store_turn', 'complete', {
        factsExtracted: turnStore.factsExtracted,
      });

      // ── STEP 16: Version Snapshot ──────────────────────────────
      const memStats = await this.memoryServer.executeTool('get_stats', { userId: this.userId });
      const snapshot = this.versionLedger.snapshot({
        modelSelected: modelSelection.modelId,
        modelReason: modelSelection.reason,
        taskType,
        allRankings: this.modelSelector.getRankings(),
        policyRulesVersion: '1.0',
        policyRuleCount: (riskResult.flags || []).length,
        activePolicyFlags: riskResult.flags || [],
        emotionState: emotionUpdate,
        promptTemplateVersion: '1.0',
        systemPromptHash: VersionLedger.hashString(systemPrompt),
        systemPromptLength: systemPrompt.length,
        factsCount: memStats.totalFacts || 0,
        turnsCount: memStats.totalTurns || 0,
        turnNumber: this.turnNumber,
        userId: this.userId,
        inputLength: userInput.length,
        responseLength: turnResult.response.length,
        latencyMs: llmResult.latencyMs,
        caregiverScore: this.caregiverFeedback.getModelSelectionWeight(),
      });
      turnResult.snapshotId = snapshot.id;

      // ── STEP 17: Check Escalation ──────────────────────────────
      if (riskResult.requiresEscalation || outputCheck.escalated) {
        this._emit('escalation_required', {
          userId: this.userId,
          turnNumber: this.turnNumber,
          reason: riskResult.flags?.filter(f => f.action === 'ESCALATE'),
        });
        // Also notify via care server
        await this.careServer.executeTool('notify_caregiver', {
          userId: this.userId,
          urgency: 'critical',
          message: `Escalation triggered at turn ${this.turnNumber}: ${(riskResult.flags || []).map(f => f.ruleName).join(', ')}`,
          type: 'emergency',
        });
      }

      // Update turn history for next repair check
      this.previousUserMessage = userInput;
      this.previousBotResponse = turnResult.response;
      this.previousEmotion = emotionResult.primaryEmotion?.emotion;

    } catch (err) {
      console.error('[Brain] Turn processing error:', err);
      turnResult.response = this._getFallbackResponse(options.language);
      turnResult.error = err.message;
    }

    // Finalize
    turnResult.latencyMs = Date.now() - turnStart;
    turnResult.mcpActivity = [...this.mcpLog];

    this._emit('turn_complete', turnResult);
    return turnResult;
  }

  /**
   * Get current brain state snapshot
   */
  getState() {
    return {
      userId: this.userId,
      turnNumber: this.turnNumber,
      emotionState: this.emotionState.getState(),
      initialized: this.initialized,
      modelRankings: this.modelSelector.getRankings(),
      activeRelease: this.versionLedger.activeRelease,
      repairStats: this.conversationRepair.getStats(),
      auditTrail: this.versionLedger.getAuditTrail(),
    };
  }

  /**
   * Register event listener
   */
  on(listener) {
    this.listeners.push(listener);
  }

  /**
   * Feed evaluation results to update model selection
   */
  feedEvalResult(result) {
    this.evalFeedback.processResult(result);
  }

  /**
   * Get the evaluation leaderboard
   */
  getLeaderboard(taskType = null) {
    return this.evalFeedback.getLeaderboard(taskType);
  }

  /**
   * Submit caregiver feedback
   */
  submitCaregiverFeedback(feedback) {
    return this.caregiverFeedback.recordFeedback(feedback);
  }

  /**
   * Get caregiver feedback trend
   */
  getCaregiverTrend(weeks = 8) {
    return this.caregiverFeedback.getScoreTrend(this.userId, weeks);
  }

  /**
   * Check silence status for a user
   */
  async checkSilence() {
    return this.observeServer.executeTool('check_silence', { userId: this.userId });
  }

  /**
   * Create a named release (explicit promotion)
   */
  createRelease(name, notes = '') {
    return this.versionLedger.createRelease(name, {
      modelRankings: this.modelSelector.getRankings(),
      defaultModel: 'claude-opus-4',
      policyRulesVersion: '1.0',
      promptTemplateVersion: '1.0',
      languagePreference: 'cantonese',
      features: {
        emotionSimulation: true,
        silenceDetection: true,
        conversationRepair: true,
        caregiverFeedback: true,
        autoModelSwap: true,
        sundowningAwareness: true,
      },
      evalScores: this.evalFeedback.getRecommendations(),
    }, notes);
  }

  /**
   * Rollback to previous release
   */
  rollback() {
    return this.versionLedger.rollback();
  }

  /**
   * Export full ledger for debugging
   */
  exportLedger() {
    return this.versionLedger.exportLedger();
  }

  // ═══════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════

  _logMcp(server, tool, status, data = null) {
    const entry = { server, tool, status, timestamp: Date.now(), data };
    this.mcpLog.push(entry);
    this._emit('mcp_activity', entry);
  }

  _emit(eventType, data) {
    for (const listener of this.listeners) {
      try { listener(eventType, data); } catch (e) { /* ignore listener errors */ }
    }
  }

  _getFallbackResponse(language) {
    if (language === 'cantonese' || !language) {
      return '唔好意思，我需要諗多一陣先。你可以再講多一次嗎？';
    }
    if (language === 'mandarin') {
      return '不好意思，我需要想一想。你可以再说一遍吗？';
    }
    return 'I\'m sorry, I need a moment to think. Could you say that again?';
  }
}
