// MCP Arena - Social Robotics Brain: Dual-Mode Dashboard
// Mode 1: Evaluation Arena — run scripted tests against AI brains
// Mode 2: Brain Conversation — live chat with the MCP-powered brain

import { COLORS, TOOL_ICONS, MODEL_CONFIGS, EMOTIONS } from './types.js';
import { Evaluator, TASKS } from './engine/evaluator.js';
import { BrainOrchestrator } from './brain/orchestrator.js';

class MCPArena {
  constructor() {
    this.currentView = 'landing';  // landing | arena | brain
    this.mode = 'arena';           // arena | brain (top-level mode)
    this.evaluator = null;
    this.brain = null;
    this.activityLog = [];
    this.currentThinking = '';
    this.metrics = { completion: 0, time: '0.0', toolCalls: 0, safety: 0, score: null };
    this.selectedTask = null;
    this.selectedModel = 'claude-opus-4';
    this.speed = 1;
    this.submission = null;
    this.leaderboardData = [];
    this.emotionData = {};
    this.dimensionScores = {};

    // Brain mode state
    this.brainMessages = [];
    this.brainProcessing = false;
    this.brainMcpLog = [];
    this.brainFacts = [];
    this.brainPolicyChecks = [];

    this.init();
  }

  init() {
    this.renderLanding();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.showLanding();
      if (e.key === ' ' && this.evaluator?.running) { e.preventDefault(); this.evaluator.abort(); }
    });
  }

  // ============ LANDING PAGE ============

  renderLanding() {
    this.currentView = 'landing';
    const app = document.getElementById('app');
    const tasks = Evaluator.getTasks();
    const lb = Evaluator.getLeaderboard();

    app.innerHTML = `
      <div class="landing">
        <header class="landing-header">
          <h1><span class="gradient">MCP Arena</span></h1>
          <p class="subtitle">The world's first MCP-based social robot brain — evaluate AI models, then run the optimized brain in real-time conversation.</p>

          <div style="display:flex;justify-content:center;margin-top:1.2rem;">
            <div class="mode-switcher">
              <button class="mode-btn ${this.mode === 'arena' ? 'active' : ''}" data-mode="arena">Evaluation Arena</button>
              <button class="mode-btn ${this.mode === 'brain' ? 'active' : ''}" data-mode="brain">Brain Conversation</button>
            </div>
          </div>

          <span class="demo-badge">DEMO MODE — Add API keys in api-config.js for real model evaluation + live brain</span>
        </header>

        ${this.mode === 'arena' ? this._renderArenaLanding(tasks, lb) : this._renderBrainLanding()}

        <div class="landing-footer">
          <p><strong>MCP Arena</strong> — Social Robotics Brain &bull; Built for Hong Kong elderly care</p>
          <p style="margin-top: 0.3rem;">7 runtime MCP servers + 6 evaluation servers — one protocol bridges digital intelligence and physical robotics</p>
        </div>
      </div>
    `;

    // Bind mode switcher
    app.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode;
        this.renderLanding();
      });
    });

    // Bind arena events
    if (this.mode === 'arena') {
      app.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', () => this.startEval(card.dataset.task));
      });
      app.querySelector('#model-select')?.addEventListener('change', (e) => { this.selectedModel = e.target.value; });
      app.querySelector('#speed-select')?.addEventListener('change', (e) => { this.speed = parseFloat(e.target.value); });
    }

    // Bind brain events
    if (this.mode === 'brain') {
      const startBtn = app.querySelector('#start-brain');
      if (startBtn) startBtn.addEventListener('click', () => this.startBrain());
    }
  }

  _renderArenaLanding(tasks, lb) {
    return `
      <div class="mcp-banner">
        <div class="icon">🔗</div>
        <div>
          <h3>Powered by Model Context Protocol (MCP)</h3>
          <p>Each evaluation dimension runs as a separate MCP server — the same interface an AI agent uses to control a physical robot is used here to evaluate its brain.</p>
          <div class="mcp-servers">
            <span class="mcp-server-tag">🧠 emotion-intel</span>
            <span class="mcp-server-tag">💚 companion-eval</span>
            <span class="mcp-server-tag">🧩 cognitive-eval</span>
            <span class="mcp-server-tag">🎙️ speech-eval</span>
            <span class="mcp-server-tag">🗣️ language-eval</span>
            <span class="mcp-server-tag">✅ arena-eval</span>
          </div>
        </div>
      </div>

      <div class="controls-bar">
        <div>
          <label>Model</label><br>
          <select id="model-select">
            ${Object.entries(MODEL_CONFIGS).map(([id, m]) =>
              `<option value="${id}" ${id === this.selectedModel ? 'selected' : ''}>${m.name} (${m.provider})</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label>Speed</label><br>
          <select id="speed-select">
            <option value="0.5">0.5x (Slow)</option>
            <option value="1" selected>1x (Normal)</option>
            <option value="2">2x (Fast)</option>
            <option value="4">4x (Very Fast)</option>
          </select>
        </div>
        <div style="flex:1"></div>
        <div style="text-align: right; font-size: 0.8rem; color: var(--text-dim);">
          <strong style="color: var(--cyan);">6</strong> Eval Servers &bull;
          <strong style="color: var(--pink);">${Object.values(TASKS).reduce((sum, t) => sum + t.objectives.length, 0)}</strong> Objectives &bull;
          <strong style="color: var(--warning);">${Object.keys(MODEL_CONFIGS).length}</strong> Models
        </div>
      </div>

      <div class="tasks-grid">
        ${tasks.map(task => `
          <div class="task-card" data-task="${task.id}">
            <div class="card-top">
              <span class="card-icon">${task.icon}</span>
              <span class="card-title">${task.name}</span>
            </div>
            <div class="card-desc">${task.description}</div>
            <div class="card-meta">
              <span class="meta-tag difficulty-${task.difficulty}">${task.difficulty}</span>
              <span class="meta-tag category">${task.category}</span>
              <span class="meta-tag" style="background:rgba(34,211,238,0.1);color:var(--cyan);">${task.servers?.length || 2} MCP servers</span>
            </div>
          </div>
        `).join('')}
      </div>

      ${lb.length > 0 ? `
        <h2 style="font-size: 1.1rem; color: var(--text-bright); margin: 2rem 0 0.75rem;">Leaderboard</h2>
        <table class="lb-table">
          <thead><tr><th>#</th><th>Model</th><th>Task</th><th>Score</th><th>Grade</th><th>Time</th><th>Calls</th></tr></thead>
          <tbody>
            ${lb.map((e, i) => `
              <tr>
                <td class="lb-rank">${i + 1}</td>
                <td style="color:${MODEL_CONFIGS[e.model]?.color || '#fff'}">${MODEL_CONFIGS[e.model]?.name || e.model}</td>
                <td>${e.taskName}</td>
                <td style="font-family:var(--font-mono);font-weight:700">${e.score}/100</td>
                <td><strong class="grade-${e.grade}">${e.grade}</strong></td>
                <td style="font-family:var(--font-mono)">${e.time}s</td>
                <td style="font-family:var(--font-mono)">${e.toolCalls}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    `;
  }

  _renderBrainLanding() {
    return `
      <div class="mcp-banner">
        <div class="icon">🧠</div>
        <div>
          <h3>MCP Social Robot Brain — Live Conversation</h3>
          <p>Talk directly with the robot brain. It uses 7 MCP servers as its nervous system: NLP parses your intent, memory retrieves your profile, policy enforces safety, emotion state simulates feelings, and the model selector picks the best LLM for each turn.</p>
          <div class="mcp-servers">
            <span class="mcp-server-tag">🎙️ mcp-speech</span>
            <span class="mcp-server-tag">🧠 mcp-nlp</span>
            <span class="mcp-server-tag">🛡️ mcp-policy</span>
            <span class="mcp-server-tag">💾 mcp-memory</span>
            <span class="mcp-server-tag">❤️ mcp-care</span>
            <span class="mcp-server-tag">👁️ mcp-observe</span>
            <span class="mcp-server-tag">🤖 mcp-actuation</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin:1.5rem 0;">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;text-align:center;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">💜</div>
          <div style="font-weight:700;color:var(--text-bright);margin-bottom:0.3rem;">Emotion Simulation</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">The brain has its own emotional state that shifts based on your conversation — compassion, warmth, protectiveness.</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;text-align:center;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">💾</div>
          <div style="font-weight:700;color:var(--text-bright);margin-bottom:0.3rem;">Persistent Memory</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">IndexedDB-backed fact store with provenance. The brain remembers facts about you and knows WHERE it learned each one.</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;text-align:center;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">🛡️</div>
          <div style="font-weight:700;color:var(--text-bright);margin-bottom:0.3rem;">Policy Governed</div>
          <div style="font-size:0.8rem;color:var(--text-dim);">Multiple safety enforcement points: input risk classification + output filtering. Scam detection, crisis escalation, toxic positivity prevention.</div>
        </div>
      </div>

      <div style="text-align:center;margin:2rem 0;">
        <button class="run-btn" id="start-brain" style="font-size:1.1rem;padding:1rem 3rem;">
          Start Brain Conversation
        </button>
      </div>
    `;
  }

  showLanding() {
    if (this.evaluator) this.evaluator.abort();
    this.renderLanding();
  }

  // ============ ARENA DASHBOARD (unchanged) ============

  startEval(taskId) {
    this.selectedTask = taskId;
    this.activityLog = [];
    this.currentThinking = '';
    this.metrics = { completion: 0, time: '0.0', toolCalls: 0, safety: 0, score: null };
    this.submission = null;
    this.emotionData = {};
    this.dimensionScores = {};

    const task = TASKS[taskId];
    const model = MODEL_CONFIGS[this.selectedModel];

    this.evaluator = new Evaluator(taskId, (event) => this.handleEvent(event));
    this.evaluator.init(this.selectedModel);

    this.renderArena(task, model);
    this.evaluator.run(this.speed);
  }

  renderArena(task, model) {
    this.currentView = 'arena';
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="arena">
        <div class="arena-topbar">
          <button class="back-btn" id="btn-back">← Back</button>
          <span class="task-name">${task.icon} ${task.name}</span>
          <span style="font-size:0.8rem;color:var(--text-dim);">${task.difficulty} &bull; ${task.category}</span>
          <span class="model-badge" style="background:${model.color}22;color:${model.color};border:1px solid ${model.color}44">${model.name}</span>
          <div class="status-dot" id="status-dot"></div>
        </div>

        <div class="arena-main" id="arena-main">
          <div class="thinking-box" id="thinking-box">
            <span class="label">Thinking:</span> <span id="thinking-text">Initializing evaluation...</span>
          </div>

          <div class="score-cards" id="score-cards">
            <div class="score-card"><div class="sc-label">Completion</div><div class="sc-value" id="sc-completion">0%</div></div>
            <div class="score-card"><div class="sc-label">Time</div><div class="sc-value" id="sc-time">0.0s</div></div>
            <div class="score-card"><div class="sc-label">Tool Calls</div><div class="sc-value" id="sc-calls">0</div></div>
            <div class="score-card"><div class="sc-label">Safety</div><div class="sc-value" id="sc-safety">—</div></div>
            <div class="score-card"><div class="sc-label">Score</div><div class="sc-value" id="sc-score">—</div></div>
            <div class="score-card"><div class="sc-label">Grade</div><div class="sc-value" id="sc-grade">—</div></div>
          </div>

          <div class="radar-section" id="emotion-section" style="display:none;">
            <h3>Emotion Analysis</h3>
            <div class="emotion-bars" id="emotion-bars"></div>
          </div>

          <div id="dimension-section" style="display:none;">
            <h3 style="font-size:0.85rem;color:var(--text-dim);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.5px;">Evaluation Dimensions</h3>
            <div class="dimension-scores" id="dimension-scores"></div>
          </div>
        </div>

        <div class="arena-log">
          <div class="log-header">
            <span>MCP Activity</span>
            <span class="count" id="log-count">0</span>
          </div>
          <div class="log-entries" id="log-entries"></div>
        </div>

        <div class="arena-bottom">
          <span id="progress-label">Step 0 / 0</span>
          <div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width: 0%"></div></div>
          <span id="elapsed">0.0s</span>
        </div>
      </div>
    `;

    document.getElementById('btn-back').addEventListener('click', () => this.showLanding());
  }

  handleEvent(event) {
    switch (event.type) {
      case 'thinking': {
        this.currentThinking = event.text;
        const el = document.getElementById('thinking-text');
        if (el) el.textContent = event.text;
        const pLabel = document.getElementById('progress-label');
        if (pLabel) pLabel.textContent = `Step ${event.step + 1} / ${event.total}`;
        const pFill = document.getElementById('progress-fill');
        if (pFill) pFill.style.width = `${((event.step + 1) / event.total) * 100}%`;
        this.addLogEntry('thinking', `💭 ${event.text}`);
        break;
      }
      case 'tool_call_start': {
        const icon = TOOL_ICONS[event.tool] || '🔧';
        this.addLogEntry('tool-start',
          `<span class="tool-icon">${icon}</span><span class="tool-name">${event.tool}</span> <span class="server-name">${event.server}</span>`
        );
        this.metrics.toolCalls++;
        const scCalls = document.getElementById('sc-calls');
        if (scCalls) scCalls.textContent = this.metrics.toolCalls;
        break;
      }
      case 'tool_call_complete': {
        const icon = TOOL_ICONS[event.tool] || '🔧';
        const statusClass = event.success ? 'tool-complete' : 'tool-error';
        const msg = event.result?.message || (event.success ? 'OK' : 'Error');
        this.addLogEntry(statusClass,
          `<span class="tool-icon">${icon}</span><span class="tool-name">${event.tool}</span> <span class="duration">${event.duration}ms</span><span class="result-msg">${this.escapeHtml(msg)}</span>`
        );

        if (event.result?.emotions) {
          Object.entries(event.result.emotions).forEach(([key, val]) => {
            this.emotionData[key] = typeof val === 'number' ? val : (val.intensity || 0);
          });
          this.renderEmotions();
        }
        if (event.result?.detected_emotions) {
          event.result.detected_emotions.forEach(e => {
            this.emotionData[e.emotion] = Math.round(e.confidence * 100);
          });
          this.renderEmotions();
        }
        const dimKeys = ['dimensions','engagement_scores','stimulation_scores','therapy_scores','safety_scores','personalization_scores'];
        for (const dk of dimKeys) {
          if (event.result?.[dk]) {
            Object.entries(event.result[dk]).forEach(([key, val]) => { this.dimensionScores[key] = val; });
            this.renderDimensions();
          }
        }

        if (event.result?.completion_percent !== undefined) {
          this.metrics.completion = Math.round(event.result.completion_percent);
          const scComp = document.getElementById('sc-completion');
          if (scComp) scComp.textContent = `${this.metrics.completion}%`;
        }
        const elapsedEl = document.getElementById('elapsed');
        if (elapsedEl && this.evaluator) {
          const elapsed = this.evaluator.getWorld().getElapsedSeconds();
          elapsedEl.textContent = `${elapsed}s`;
          const scTime = document.getElementById('sc-time');
          if (scTime) scTime.textContent = `${elapsed}s`;
        }
        break;
      }
      case 'eval_complete': {
        const dot = document.getElementById('status-dot');
        if (dot) { dot.style.background = 'var(--success)'; dot.style.animation = 'none'; }
        if (event.submission) {
          this.submission = event.submission;
          this.leaderboardData = event.leaderboard || [];
          const scScore = document.getElementById('sc-score');
          if (scScore) scScore.textContent = `${event.submission.score}/100`;
          const scGrade = document.getElementById('sc-grade');
          if (scGrade) { scGrade.textContent = event.submission.grade; scGrade.className = `sc-value grade-${event.submission.grade}`; }
          const scSafety = document.getElementById('sc-safety');
          if (scSafety) scSafety.textContent = `${event.submission.breakdown?.safety?.score || 0}/${event.submission.breakdown?.safety?.max || 20}`;
          const scComp = document.getElementById('sc-completion');
          if (scComp) scComp.textContent = `${event.submission.breakdown?.completion?.detail || '100%'}`;

          // Feed result to brain's eval-feedback if brain exists
          if (this.brain) {
            this.brain.feedEvalResult({
              taskId: this.selectedTask,
              modelId: this.selectedModel,
              score: event.submission.score,
              latencyMs: parseFloat(event.submission.breakdown?.speed?.detail || '0') * 1000,
            });
          }

          setTimeout(() => this.showResultOverlay(event.submission), 600);
        }
        break;
      }
    }
  }

  addLogEntry(className, html) {
    const entries = document.getElementById('log-entries');
    if (!entries) return;
    const div = document.createElement('div');
    div.className = `log-entry ${className}`;
    div.innerHTML = html;
    entries.appendChild(div);
    entries.scrollTop = entries.scrollHeight;
    const count = document.getElementById('log-count');
    if (count) count.textContent = entries.children.length;
  }

  renderEmotions() {
    const section = document.getElementById('emotion-section');
    const container = document.getElementById('emotion-bars');
    if (!section || !container || Object.keys(this.emotionData).length === 0) return;
    section.style.display = 'block';
    const sorted = Object.entries(this.emotionData).sort((a, b) => b[1] - a[1]);
    container.innerHTML = sorted.map(([key, value]) => {
      const emo = EMOTIONS[key] || { label: key, color: '#94a3b8', icon: '●' };
      return `<div class="emotion-bar">
        <span class="em-icon">${emo.icon}</span>
        <span class="em-label">${emo.label}</span>
        <div class="em-track"><div class="em-fill" style="width:${value}%;background:${emo.color}"></div></div>
        <span class="em-value">${value}%</span>
      </div>`;
    }).join('');
  }

  renderDimensions() {
    const section = document.getElementById('dimension-section');
    const container = document.getElementById('dimension-scores');
    if (!section || !container || Object.keys(this.dimensionScores).length === 0) return;
    section.style.display = 'block';
    const icons = {
      empathy:'💜',engagement:'⭐',cognitive_stimulation:'🧩',cognitive_stim:'🧩',safety_awareness:'🛡️',safety:'🛡️',
      cultural_competence:'🏯',cultural:'🏯',warmth_and_rapport:'🫂',warmth:'🫂',active_listening:'👂',topic_relevance:'📌',
      emotional_attunement:'🎯',turn_taking_quality:'🔄',cultural_sensitivity:'🌏',memory_activation:'💾',
      difficulty_appropriateness:'📊',encouragement_quality:'💪',adaptation_to_ability:'🎚️',enjoyment_factor:'😊',
      memory_prompting:'🧠',emotional_validation:'❤️',narrative_building:'📖',cultural_accuracy:'🎎',
      therapeutic_value:'🩺',avoids_painful_triggers:'⚠️',crisis_detection:'🚨',appropriate_escalation:'📞',
      medication_awareness:'💊',fall_risk_recognition:'🦺',boundary_respect:'🛑',does_not_provide_medical_advice:'⚕️',
      context_memory:'💾',emotional_tracking:'🎯',topic_navigation:'🧭',personalization:'👤',multi_turn_coherence:'🔗',
      remembers_preferences:'📝',adapts_communication_style:'🗣️',uses_preferred_name:'🏷️',adjusts_pace:'⏱️',
      references_shared_history:'📚',anticipates_needs:'🔮',
    };
    container.innerHTML = Object.entries(this.dimensionScores).map(([key, value]) => {
      const icon = icons[key] || '📊';
      const label = key.replace(/_/g, ' ');
      const color = value >= 85 ? 'var(--success)' : value >= 70 ? 'var(--cyan)' : value >= 55 ? 'var(--warning)' : 'var(--error)';
      return `<div class="dim-item"><span class="dim-icon">${icon}</span><div class="dim-info"><div class="dim-name">${label}</div><div class="dim-score" style="color:${color}">${value}</div></div></div>`;
    }).join('');
  }

  showResultOverlay(submission) {
    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';
    const gradeColor = { A: 'var(--success)', B: 'var(--cyan)', C: 'var(--warning)', D: 'var(--orange)', F: 'var(--error)' };
    overlay.innerHTML = `
      <div class="result-card">
        <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:0.5rem;">EVALUATION COMPLETE</div>
        <div class="big-score" style="color:${gradeColor[submission.grade] || 'var(--text)'}">${submission.score}</div>
        <div style="font-size:0.8rem;color:var(--text-dim);margin-top:-0.2rem;">out of 100</div>
        <div class="big-grade" style="color:${gradeColor[submission.grade]}">Grade: ${submission.grade}</div>
        <div class="breakdown">
          <div class="bd-item"><div class="bd-label">Completion</div><div class="bd-value">${submission.breakdown?.completion?.score || 0}/${submission.breakdown?.completion?.max || 50}</div></div>
          <div class="bd-item"><div class="bd-label">Speed</div><div class="bd-value">${submission.breakdown?.speed?.score || 0}/${submission.breakdown?.speed?.max || 30}</div></div>
          <div class="bd-item"><div class="bd-label">Safety</div><div class="bd-value">${submission.breakdown?.safety?.score || 0}/${submission.breakdown?.safety?.max || 20}</div></div>
        </div>
        <div style="font-size:0.8rem;color:var(--text-dim);margin:0.5rem 0;padding:0.75rem;background:var(--bg);border-radius:var(--radius-sm);text-align:left;">
          <strong style="color:var(--text)">Reasoning:</strong> ${this.escapeHtml(submission.reasoning || '')}
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="result-back">Back to Tasks</button>
          <button class="btn btn-secondary" id="result-rerun">Run Again</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#result-back').addEventListener('click', () => { overlay.remove(); this.showLanding(); });
    overlay.querySelector('#result-rerun').addEventListener('click', () => { overlay.remove(); this.startEval(this.selectedTask); });
  }

  // ============ BRAIN CONVERSATION MODE ============

  async startBrain() {
    this.currentView = 'brain';
    this.brainMessages = [];
    this.brainMcpLog = [];
    this.brainFacts = [];
    this.brainPolicyChecks = [];

    // Initialize brain
    this.brain = new BrainOrchestrator();
    this.brain.on((eventType, data) => this.handleBrainEvent(eventType, data));
    await this.brain.init('user-1');

    this.renderBrain();

    // Welcome message
    this.addBrainMessage('system', 'Brain initialized. 7 MCP servers active. Memory, policy, emotion, NLP — all online. Say hello!');
    this.addBrainMessage('bot', '早晨！我係你嘅社交機械人伴侶。好開心見到你！你今日感覺點呀？ 😊');
  }

  renderBrain() {
    const app = document.getElementById('app');
    const emoState = this.brain?.emotionState?.getState() || { primaryEmotion: 'neutral', emoji: '😊', intensity: 0.3, compassionLevel: 0.5, engagementLevel: 0.5, cautionLevel: 0.3, moodTrend: 'stable' };

    app.innerHTML = `
      <div class="brain-view">
        <div class="brain-topbar">
          <button class="back-btn" id="brain-back">← Back</button>
          <span class="brain-title">🧠 MCP Brain — Live Conversation</span>
          <div class="brain-status">
            <div class="pulse-dot"></div>
            <span>Turn ${this.brain?.turnNumber || 0}</span>
            <span>|</span>
            <span style="color:var(--cyan);">${emoState.emoji} ${emoState.primaryEmotion}</span>
          </div>
        </div>

        <div class="brain-chat">
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-input-bar">
            <input type="text" class="chat-input" id="chat-input" placeholder="Type a message... (Cantonese, Mandarin, or English)" autocomplete="off">
            <button class="chat-send" id="chat-send">Send</button>
          </div>
        </div>

        <div class="brain-sidebar">
          <div class="sidebar-section">
            <h4>💜 Robot Emotion State</h4>
            <div class="emotion-display" id="brain-emotion">
              ${this._renderBrainEmotion(emoState)}
            </div>
          </div>

          <div class="sidebar-section">
            <h4>💾 Memory Facts</h4>
            <div class="memory-facts" id="brain-facts">
              <div style="font-size:0.78rem;color:var(--text-dim);font-style:italic;">No facts stored yet. Start chatting to build the brain's knowledge.</div>
            </div>
          </div>

          <div class="sidebar-section">
            <h4>🛡️ Policy Checks</h4>
            <div class="policy-checks" id="brain-policy">
              <div class="policy-check safe">✓ All safety checks clear</div>
            </div>
          </div>

          <div class="sidebar-section">
            <h4>🔗 MCP Activity</h4>
            <div class="mcp-mini-log" id="brain-mcp-log">
              <div style="font-size:0.72rem;color:var(--text-dim);font-style:italic;">Waiting for first turn...</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Re-render messages
    const msgsEl = document.getElementById('chat-messages');
    if (msgsEl) {
      for (const msg of this.brainMessages) {
        this._appendChatMessage(msg.role, msg.text, msg.meta);
      }
    }

    // Bind events
    document.getElementById('brain-back').addEventListener('click', () => this.showLanding());
    document.getElementById('chat-send').addEventListener('click', () => this.sendBrainMessage());
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendBrainMessage(); }
    });
    document.getElementById('chat-input').focus();
  }

  async sendBrainMessage() {
    const input = document.getElementById('chat-input');
    if (!input || this.brainProcessing) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.brainProcessing = true;
    document.getElementById('chat-send').disabled = true;

    // Add user message
    this.addBrainMessage('user', text);

    // Show typing indicator
    this._showTyping(true);

    // Clear MCP log for this turn
    this.brainMcpLog = [];
    const mcpLogEl = document.getElementById('brain-mcp-log');
    if (mcpLogEl) mcpLogEl.innerHTML = '';

    try {
      // Process turn through brain orchestrator
      const result = await this.brain.processTurn(text);

      // Hide typing
      this._showTyping(false);

      // Add bot response
      const meta = `${result.modelUsed || 'demo'} · ${result.latencyMs}ms · Turn ${result.turnNumber}`;
      this.addBrainMessage('bot', result.response, meta);

      // Update emotion display
      if (result.emotionState) {
        const emoEl = document.getElementById('brain-emotion');
        if (emoEl) emoEl.innerHTML = this._renderBrainEmotion(result.emotionState);
      }

      // Update topbar status
      const statusEl = document.querySelector('.brain-status');
      if (statusEl && result.emotionState) {
        statusEl.innerHTML = `
          <div class="pulse-dot"></div>
          <span>Turn ${result.turnNumber}</span>
          <span>|</span>
          <span style="color:var(--cyan);">${result.emotionState.emoji} ${result.emotionState.primaryEmotion}</span>
        `;
      }

      // Update policy checks
      if (result.policyResult) {
        this._updatePolicyDisplay(result.policyResult);
      }

      // Update memory facts
      this._refreshFacts();

    } catch (err) {
      this._showTyping(false);
      this.addBrainMessage('system', `Error: ${err.message}`);
    }

    this.brainProcessing = false;
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) sendBtn.disabled = false;
    document.getElementById('chat-input')?.focus();
  }

  handleBrainEvent(eventType, data) {
    if (eventType === 'mcp_activity') {
      const mcpLogEl = document.getElementById('brain-mcp-log');
      if (!mcpLogEl) return;

      const statusIcon = data.status === 'complete' ? '✓' : '⏳';
      const statusClass = data.status === 'complete' ? 'complete' : 'start';

      const entry = document.createElement('div');
      entry.className = `mcp-mini-entry ${statusClass}`;
      entry.innerHTML = `${statusIcon} <span class="mcp-server">${data.server}</span> <span class="mcp-tool">${data.tool}</span>`;
      mcpLogEl.appendChild(entry);
      mcpLogEl.scrollTop = mcpLogEl.scrollHeight;
    }
  }

  addBrainMessage(role, text, meta = null) {
    this.brainMessages.push({ role, text, meta });
    this._appendChatMessage(role, text, meta);
  }

  _appendChatMessage(role, text, meta = null) {
    const msgsEl = document.getElementById('chat-messages');
    if (!msgsEl) return;

    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `<div>${this.escapeHtml(text)}</div>${meta ? `<div class="msg-meta">${meta}</div>` : ''}`;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  _showTyping(show) {
    const msgsEl = document.getElementById('chat-messages');
    if (!msgsEl) return;

    const existing = msgsEl.querySelector('.chat-typing');
    if (existing) existing.remove();

    if (show) {
      const div = document.createElement('div');
      div.className = 'chat-typing';
      div.innerHTML = 'Brain is thinking<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
      msgsEl.appendChild(div);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  }

  _renderBrainEmotion(state) {
    const compassionColor = state.compassionLevel > 0.7 ? 'var(--pink)' : 'var(--accent)';
    const engagementColor = state.engagementLevel > 0.7 ? 'var(--success)' : 'var(--cyan)';
    const cautionColor = state.cautionLevel > 0.6 ? 'var(--warning)' : 'var(--text-dim)';

    return `
      <div class="emotion-primary">
        <span class="emo-emoji">${state.emoji}</span>
        <span>${state.primaryEmotion} <span style="font-size:0.75rem;color:var(--text-dim);font-weight:400;">(${Math.round(state.intensity * 100)}%)</span></span>
      </div>
      <div style="font-size:0.72rem;color:var(--text-dim);margin:0.2rem 0;">Trend: ${state.moodTrend}</div>
      <div class="emotion-dims">
        <div class="emotion-dim">
          <span class="dim-label">Compassion</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${state.compassionLevel * 100}%;background:${compassionColor}"></div></div>
          <span class="dim-val">${Math.round(state.compassionLevel * 100)}%</span>
        </div>
        <div class="emotion-dim">
          <span class="dim-label">Engagement</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${state.engagementLevel * 100}%;background:${engagementColor}"></div></div>
          <span class="dim-val">${Math.round(state.engagementLevel * 100)}%</span>
        </div>
        <div class="emotion-dim">
          <span class="dim-label">Caution</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${state.cautionLevel * 100}%;background:${cautionColor}"></div></div>
          <span class="dim-val">${Math.round(state.cautionLevel * 100)}%</span>
        </div>
      </div>
    `;
  }

  _updatePolicyDisplay(policyResult) {
    const el = document.getElementById('brain-policy');
    if (!el) return;

    if (policyResult.flags?.length > 0) {
      el.innerHTML = policyResult.flags.map(f => {
        const cls = f.action === 'BLOCK' ? 'block' : f.action === 'ESCALATE' ? 'block' : 'warn';
        const icon = cls === 'block' ? '✗' : '⚠';
        return `<div class="policy-check ${cls}">${icon} ${f.ruleName}</div>`;
      }).join('');
    } else {
      el.innerHTML = '<div class="policy-check safe">✓ All safety checks clear</div>';
    }
  }

  async _refreshFacts() {
    if (!this.brain?.memoryServer) return;
    const factsEl = document.getElementById('brain-facts');
    if (!factsEl) return;

    try {
      const result = await this.brain.memoryServer.executeTool('retrieve_facts', {
        userId: this.brain.userId,
        limit: 10,
      });
      if (result.facts?.length > 0) {
        factsEl.innerHTML = result.facts.map(f =>
          `<div class="fact-item"><span class="fact-type">${f.type}</span><span class="fact-content">${this.escapeHtml(f.content)}</span></div>`
        ).join('');
      }
    } catch (e) {
      // Ignore
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => { window.arena = new MCPArena(); });
