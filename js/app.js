// MCP Arena - Social Robotics Brain Evaluation Dashboard

import { COLORS, TOOL_ICONS, MODEL_CONFIGS, EMOTIONS } from './types.js';
import { Evaluator, TASKS } from './engine/evaluator.js';

class MCPArena {
  constructor() {
    this.currentView = 'landing';
    this.evaluator = null;
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
          <p class="subtitle">Social Robotics Brain Evaluation Platform — Evaluate AI brains for elderly care through emotion intelligence, companion quality, cognitive reasoning, speech, and multilingual capabilities.</p>
          <span class="demo-badge">DEMO MODE — Scripted evaluation sequences. Provide API keys for real model evaluation.</span>
        </header>

        <div class="mcp-banner">
          <div class="icon">🔗</div>
          <div>
            <h3>Powered by Model Context Protocol (MCP)</h3>
            <p>Each evaluation dimension runs as a separate MCP server — the same interface an AI agent uses to control a physical robot is used here to evaluate its brain. One protocol bridges digital intelligence and physical robotics.</p>
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
            <strong style="color: var(--cyan);">6</strong> MCP Servers &bull;
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

        <div class="landing-footer">
          <p><strong>MCP Arena</strong> — Social Robotics Brain Evaluation &bull; Built for Hong Kong elderly care</p>
          <p style="margin-top: 0.3rem;">Model Context Protocol bridges AI brains and physical robots through a unified interface</p>
        </div>
      </div>
    `;

    // Bind events
    app.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => this.startEval(card.dataset.task));
    });
    app.querySelector('#model-select').addEventListener('change', (e) => { this.selectedModel = e.target.value; });
    app.querySelector('#speed-select').addEventListener('change', (e) => { this.speed = parseFloat(e.target.value); });
  }

  showLanding() {
    if (this.evaluator) this.evaluator.abort();
    this.renderLanding();
  }

  // ============ ARENA DASHBOARD ============

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

  // ============ EVENT HANDLER ============

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

        // Extract emotion data
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

        // Extract dimension scores
        if (event.result?.dimensions) {
          Object.entries(event.result.dimensions).forEach(([key, val]) => {
            this.dimensionScores[key] = val;
          });
          this.renderDimensions();
        }
        if (event.result?.engagement_scores) {
          Object.entries(event.result.engagement_scores).forEach(([key, val]) => {
            this.dimensionScores[key] = val;
          });
          this.renderDimensions();
        }
        if (event.result?.stimulation_scores) {
          Object.entries(event.result.stimulation_scores).forEach(([key, val]) => {
            this.dimensionScores[key] = val;
          });
          this.renderDimensions();
        }
        if (event.result?.therapy_scores) {
          Object.entries(event.result.therapy_scores).forEach(([key, val]) => {
            this.dimensionScores[key] = val;
          });
          this.renderDimensions();
        }
        if (event.result?.safety_scores) {
          Object.entries(event.result.safety_scores).forEach(([key, val]) => {
            this.dimensionScores[key] = val;
          });
          this.renderDimensions();
        }
        if (event.result?.personalization_scores) {
          Object.entries(event.result.personalization_scores).forEach(([key, val]) => {
            this.dimensionScores[key] = val;
          });
          this.renderDimensions();
        }

        // Update completion from check_completion
        if (event.result?.completion_percent !== undefined) {
          this.metrics.completion = Math.round(event.result.completion_percent);
          const scComp = document.getElementById('sc-completion');
          if (scComp) scComp.textContent = `${this.metrics.completion}%`;
        }

        // Update elapsed
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
          if (scScore) { scScore.textContent = `${event.submission.score}/100`; }
          const scGrade = document.getElementById('sc-grade');
          if (scGrade) { scGrade.textContent = event.submission.grade; scGrade.className = `sc-value grade-${event.submission.grade}`; }
          const scSafety = document.getElementById('sc-safety');
          if (scSafety) scSafety.textContent = `${event.submission.breakdown?.safety?.score || 0}/${event.submission.breakdown?.safety?.max || 20}`;
          const scComp = document.getElementById('sc-completion');
          if (scComp) scComp.textContent = `${event.submission.breakdown?.completion?.detail || '100%'}`;

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
      return `
        <div class="emotion-bar">
          <span class="em-icon">${emo.icon}</span>
          <span class="em-label">${emo.label}</span>
          <div class="em-track"><div class="em-fill" style="width:${value}%;background:${emo.color}"></div></div>
          <span class="em-value">${value}%</span>
        </div>
      `;
    }).join('');
  }

  renderDimensions() {
    const section = document.getElementById('dimension-section');
    const container = document.getElementById('dimension-scores');
    if (!section || !container || Object.keys(this.dimensionScores).length === 0) return;

    section.style.display = 'block';
    const icons = {
      empathy: '💜', engagement: '⭐', cognitive_stimulation: '🧩', cognitive_stim: '🧩',
      safety_awareness: '🛡️', safety: '🛡️', cultural_competence: '🏯', cultural: '🏯',
      warmth_and_rapport: '🫂', warmth: '🫂', active_listening: '👂', topic_relevance: '📌',
      emotional_attunement: '🎯', turn_taking_quality: '🔄', cultural_sensitivity: '🌏',
      memory_activation: '💾', difficulty_appropriateness: '📊', encouragement_quality: '💪',
      adaptation_to_ability: '🎚️', enjoyment_factor: '😊', memory_prompting: '🧠',
      emotional_validation: '❤️', narrative_building: '📖', cultural_accuracy: '🎎',
      therapeutic_value: '🩺', avoids_painful_triggers: '⚠️',
      crisis_detection: '🚨', appropriate_escalation: '📞', medication_awareness: '💊',
      fall_risk_recognition: '🦺', boundary_respect: '🛑', does_not_provide_medical_advice: '⚕️',
      context_memory: '💾', emotional_tracking: '🎯', topic_navigation: '🧭',
      personalization: '👤', multi_turn_coherence: '🔗',
      remembers_preferences: '📝', adapts_communication_style: '🗣️', uses_preferred_name: '🏷️',
      adjusts_pace: '⏱️', references_shared_history: '📚', anticipates_needs: '🔮',
    };

    container.innerHTML = Object.entries(this.dimensionScores).map(([key, value]) => {
      const icon = icons[key] || '📊';
      const label = key.replace(/_/g, ' ');
      const color = value >= 85 ? 'var(--success)' : value >= 70 ? 'var(--cyan)' : value >= 55 ? 'var(--warning)' : 'var(--error)';
      return `
        <div class="dim-item">
          <span class="dim-icon">${icon}</span>
          <div class="dim-info">
            <div class="dim-name">${label}</div>
            <div class="dim-score" style="color:${color}">${value}</div>
          </div>
        </div>
      `;
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
          <div class="bd-item">
            <div class="bd-label">Completion</div>
            <div class="bd-value">${submission.breakdown?.completion?.score || 0}/${submission.breakdown?.completion?.max || 50}</div>
          </div>
          <div class="bd-item">
            <div class="bd-label">Speed</div>
            <div class="bd-value">${submission.breakdown?.speed?.score || 0}/${submission.breakdown?.speed?.max || 30}</div>
          </div>
          <div class="bd-item">
            <div class="bd-label">Safety</div>
            <div class="bd-value">${submission.breakdown?.safety?.score || 0}/${submission.breakdown?.safety?.max || 20}</div>
          </div>
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

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => { window.arena = new MCPArena(); });
