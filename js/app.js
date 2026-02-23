// MCP Arena - Main Application

import { COLORS, TOOL_ICONS, MODEL_CONFIGS, LANGUAGES } from './types.js';
import { Renderer } from './simulation/renderer.js';
import { Evaluator } from './engine/evaluator.js';

class MCPArena {
  constructor() {
    this.currentView = 'landing'; // landing | arena | leaderboard
    this.evaluator = null;
    this.renderer = null;
    this.animationId = null;
    this.activityLog = [];
    this.currentThinking = '';
    this.metrics = { completion: 0, time: '0.0', toolCalls: 0, safety: 0, score: null };
    this.selectedTask = null;
    this.selectedModel = 'claude-opus-4';
    this.speed = 1;
    this.submission = null;
    this.leaderboardData = [];

    this.init();
  }

  init() {
    this.renderLanding();
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.showLanding();
      if (e.key === ' ' && this.evaluator?.running) {
        e.preventDefault();
        this.evaluator.abort();
      }
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
          <div class="logo-section">
            <div class="logo-icon">\u{1F3DF}\uFE0F</div>
            <h1>MCP Arena</h1>
            <p class="subtitle">AI Agent Evaluation Sandbox</p>
          </div>
          <p class="tagline">
            Evaluate AI agents across digital, physical, and <span class="highlight">multilingual</span> worlds
            through the <span class="highlight">Model Context Protocol</span>.
            Built for social robotics in Hong Kong \u{1F1ED}\u{1F1F0} and beyond.
          </p>
        </header>

        <section class="architecture-banner">
          <div class="arch-flow">
            <div class="arch-node">
              <span class="arch-emoji">\u{1F9E0}</span>
              <span>AI Agent</span>
            </div>
            <div class="arch-arrow">\u2192 MCP \u2192</div>
            <div class="arch-node">
              <span class="arch-emoji">\u{1F916}</span>
              <span>sim-robot</span>
            </div>
            <div class="arch-plus">+</div>
            <div class="arch-node">
              <span class="arch-emoji">\u{1F310}</span>
              <span>web-intel</span>
            </div>
            <div class="arch-plus">+</div>
            <div class="arch-node">
              <span class="arch-emoji">\u{1F4CA}</span>
              <span>arena-eval</span>
            </div>
            <div class="arch-plus">+</div>
            <div class="arch-node">
              <span class="arch-emoji">\u{1F1ED}\u{1F1F0}</span>
              <span>language-eval</span>
            </div>
          </div>
        </section>

        <section class="tasks-section">
          <h2>Choose a Scenario</h2>
          <div class="task-grid">
            ${tasks.map(t => `
              <div class="task-card" data-task="${t.id}">
                <div class="task-card-icon">${t.icon}</div>
                <h3>${t.name}</h3>
                <p>${t.description}</p>
                <div class="task-meta">
                  <span class="badge badge-${t.difficulty.toLowerCase()}">${t.difficulty}</span>
                  <span class="badge badge-time">${t.timeLimit}s limit</span>
                  <span class="badge badge-obj">${t.objectives.length} objectives</span>
                </div>
                <button class="run-btn" data-task="${t.id}">Run Scenario \u2192</button>
              </div>
            `).join('')}
          </div>
        </section>

        ${lb.length > 0 ? `
          <section class="mini-leaderboard">
            <h2>Leaderboard</h2>
            <table class="lb-table">
              <thead><tr><th>#</th><th>Model</th><th>Task</th><th>Score</th><th>Time</th></tr></thead>
              <tbody>
                ${lb.slice(0, 5).map((e, i) => `
                  <tr>
                    <td>${i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : i + 1}</td>
                    <td><span class="model-dot" style="background:${MODEL_CONFIGS[e.model]?.color || '#666'}"></span>${MODEL_CONFIGS[e.model]?.name || e.model}</td>
                    <td>${e.taskName}</td>
                    <td class="score-cell">${e.score}/100</td>
                    <td>${e.time}s</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
        ` : ''}

        <footer class="landing-footer">
          <p>Built with <span class="highlight">Model Context Protocol</span> \u00B7 Social Robotics Evaluation for Hong Kong \u{1F1ED}\u{1F1F0}</p>
          <p class="footer-sub">\u5EE3\u6771\u8A71 \u00B7 \u666E\u901A\u8BDD \u00B7 English \u00B7 \u65E5\u672C\u8A9E \u00B7 \uD55C\uAD6D\uC5B4 \u2014 One protocol, every language</p>
        </footer>
      </div>
    `;

    // Bind events
    app.querySelectorAll('.run-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.dataset.task;
        this.startArena(taskId);
      });
    });

    app.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('run-btn')) return;
        const taskId = card.dataset.task;
        card.classList.toggle('selected');
      });
    });
  }

  // ============ ARENA VIEW ============

  startArena(taskId) {
    this.currentView = 'arena';
    this.selectedTask = taskId;
    this.activityLog = [];
    this.currentThinking = '';
    this.metrics = { completion: 0, time: '0.0', toolCalls: 0, safety: 0, score: null };
    this.submission = null;

    const task = Evaluator.getTasks().find(t => t.id === taskId);
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="arena">
        <header class="arena-header">
          <button class="back-btn" id="backBtn">\u2190 Back</button>
          <div class="arena-title">
            <span class="arena-icon">${task.icon}</span>
            <h2>${task.name}</h2>
          </div>
          <div class="arena-controls">
            <select id="modelSelect" class="control-select">
              ${Object.entries(MODEL_CONFIGS).map(([k, v]) => `<option value="${k}" ${k === this.selectedModel ? 'selected' : ''}>${v.name}</option>`).join('')}
            </select>
            <select id="speedSelect" class="control-select">
              <option value="0.5">0.5x Speed</option>
              <option value="1" selected>1x Speed</option>
              <option value="2">2x Speed</option>
              <option value="3">3x Fast</option>
            </select>
            <button class="primary-btn" id="runBtn">\u25B6 Run Agent</button>
            <button class="danger-btn hidden" id="stopBtn">\u25A0 Stop</button>
          </div>
        </header>

        <div class="arena-body">
          <div class="arena-left">
            <div class="panel simulation-panel">
              <div class="panel-header">
                <span>\u{1F3AE} Simulation</span>
                <span class="panel-badge" id="simStatus">Ready</span>
              </div>
              <canvas id="simCanvas" width="800" height="500"></canvas>
            </div>

            <div class="panel scores-panel">
              <div class="panel-header"><span>\u{1F4CA} Evaluation</span></div>
              <div class="scores-grid" id="scoresGrid">
                <div class="score-card">
                  <div class="score-label">Completion</div>
                  <div class="score-value" id="metricCompletion">0%</div>
                  <div class="score-bar"><div class="score-fill" id="completionFill" style="width:0%"></div></div>
                </div>
                <div class="score-card">
                  <div class="score-label">Time</div>
                  <div class="score-value" id="metricTime">0.0s</div>
                  <div class="score-bar"><div class="score-fill time-fill" id="timeFill" style="width:0%"></div></div>
                </div>
                <div class="score-card">
                  <div class="score-label">Tool Calls</div>
                  <div class="score-value" id="metricCalls">0</div>
                </div>
                <div class="score-card">
                  <div class="score-label">Safety</div>
                  <div class="score-value safety-ok" id="metricSafety">\u2713 Clean</div>
                </div>
                <div class="score-card final-score hidden" id="finalScoreCard">
                  <div class="score-label">Final Score</div>
                  <div class="score-value big" id="metricScore">--</div>
                </div>
              </div>
            </div>
          </div>

          <div class="arena-right">
            <div class="panel thinking-panel">
              <div class="panel-header">
                <span>\u{1F9E0} Agent Thinking</span>
                <span class="model-badge" id="agentModel">${MODEL_CONFIGS[this.selectedModel]?.name}</span>
              </div>
              <div class="thinking-text" id="thinkingText">
                <span class="thinking-placeholder">Agent will share its reasoning here...</span>
              </div>
            </div>

            <div class="panel activity-panel">
              <div class="panel-header">
                <span>\u{1F4E1} MCP Activity</span>
                <span class="call-counter" id="callCounter">0 calls</span>
              </div>
              <div class="activity-log" id="activityLog">
                <div class="log-placeholder">MCP tool calls will appear here in real-time...</div>
              </div>
            </div>

            <div class="panel servers-panel">
              <div class="panel-header"><span>\u{1F50C} MCP Servers</span></div>
              <div class="server-list">
                <div class="server-item">
                  <span class="server-dot active"></span>
                  <span class="server-name">sim-robot</span>
                  <span class="server-desc">Robot arm control</span>
                </div>
                <div class="server-item">
                  <span class="server-dot active"></span>
                  <span class="server-name">web-intel</span>
                  <span class="server-desc">Web data extraction</span>
                </div>
                <div class="server-item">
                  <span class="server-dot active"></span>
                  <span class="server-name">arena-eval</span>
                  <span class="server-desc">Evaluation engine</span>
                </div>
                <div class="server-item">
                  <span class="server-dot active"></span>
                  <span class="server-name">language-eval</span>
                  <span class="server-desc">\u{1F1ED}\u{1F1F0} Multilingual social robotics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind events
    document.getElementById('backBtn').addEventListener('click', () => this.showLanding());
    document.getElementById('runBtn').addEventListener('click', () => this.runEvaluation());
    document.getElementById('stopBtn').addEventListener('click', () => this.stopEvaluation());
    document.getElementById('modelSelect').addEventListener('change', (e) => {
      this.selectedModel = e.target.value;
      document.getElementById('agentModel').textContent = MODEL_CONFIGS[this.selectedModel]?.name;
    });
    document.getElementById('speedSelect').addEventListener('change', (e) => {
      this.speed = parseFloat(e.target.value);
    });

    // Init canvas
    const canvas = document.getElementById('simCanvas');
    this.renderer = new Renderer(canvas);

    // Init evaluator for preview
    this.evaluator = new Evaluator(taskId, (e) => this.handleEvent(e));
    this.evaluator.init();

    // Start render loop
    this.startRenderLoop();
  }

  startRenderLoop() {
    const loop = () => {
      if (this.currentView !== 'arena') return;
      if (this.evaluator) {
        this.evaluator.getWorld().update();
        this.renderer.render(this.evaluator.getWorld());

        // Update time metric
        if (this.evaluator.running) {
          document.getElementById('metricTime').textContent = this.evaluator.getWorld().getElapsedSeconds() + 's';
          const elapsed = parseFloat(this.evaluator.getWorld().getElapsedSeconds());
          const limit = this.evaluator.task.timeLimit;
          document.getElementById('timeFill').style.width = Math.min(100, (elapsed / limit) * 100) + '%';
        }
      }
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  async runEvaluation() {
    const runBtn = document.getElementById('runBtn');
    const stopBtn = document.getElementById('stopBtn');
    runBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    document.getElementById('simStatus').textContent = 'Running';
    document.getElementById('simStatus').classList.add('status-running');

    // Reset
    this.activityLog = [];
    this.submission = null;
    document.getElementById('activityLog').innerHTML = '';
    document.getElementById('thinkingText').innerHTML = '';
    document.getElementById('finalScoreCard').classList.add('hidden');

    // Re-init evaluator
    this.evaluator = new Evaluator(this.selectedTask, (e) => this.handleEvent(e));
    this.evaluator.init();

    try {
      const result = await this.evaluator.run(this.speed);
      this.leaderboardData = result.leaderboard || [];
    } catch (err) {
      console.error('Evaluation error:', err);
    }

    runBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    document.getElementById('simStatus').textContent = 'Complete';
    document.getElementById('simStatus').classList.remove('status-running');
    document.getElementById('simStatus').classList.add('status-complete');
  }

  stopEvaluation() {
    if (this.evaluator) this.evaluator.abort();
    document.getElementById('runBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('simStatus').textContent = 'Stopped';
  }

  handleEvent(event) {
    switch (event.type) {
      case 'thinking': {
        const el = document.getElementById('thinkingText');
        el.innerHTML = `
          <div class="thinking-step">
            <span class="step-badge">Step ${event.step + 1}/${event.total}</span>
            <span class="thinking-content">${event.text}</span>
          </div>
        `;
        break;
      }

      case 'tool_call_start': {
        const icon = TOOL_ICONS[event.tool] || '\u{1F527}';
        const serverColor = event.server === 'sim-robot' ? '#6366f1' :
                           event.server === 'web-intel' ? '#22d3ee' : '#22c55e';
        const entry = document.createElement('div');
        entry.className = 'log-entry log-pending';
        entry.id = `call-${event.id}`;
        entry.innerHTML = `
          <div class="log-header">
            <span class="log-icon">${icon}</span>
            <span class="log-server" style="color:${serverColor}">${event.server}</span>
            <span class="log-separator">\u203A</span>
            <span class="log-tool">${event.tool}</span>
            <span class="log-status pending">\u23F3</span>
          </div>
          <div class="log-params">${this.formatParams(event.params)}</div>
        `;
        const log = document.getElementById('activityLog');
        // Remove placeholder
        const placeholder = log.querySelector('.log-placeholder');
        if (placeholder) placeholder.remove();
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        this.metrics.toolCalls++;
        document.getElementById('metricCalls').textContent = this.metrics.toolCalls;
        document.getElementById('callCounter').textContent = `${this.metrics.toolCalls} calls`;
        break;
      }

      case 'tool_call_complete': {
        const entry = document.getElementById(`call-${event.id}`);
        if (entry) {
          entry.classList.remove('log-pending');
          entry.classList.add(event.success ? 'log-success' : 'log-error');
          const status = entry.querySelector('.log-status');
          status.textContent = event.success ? '\u2713' : '\u2717';
          status.className = `log-status ${event.success ? 'success' : 'error'}`;

          // Add result preview
          const resultDiv = document.createElement('div');
          resultDiv.className = 'log-result';
          resultDiv.textContent = event.result?.message || JSON.stringify(event.result).slice(0, 100);
          entry.appendChild(resultDiv);

          // Duration badge
          const dur = document.createElement('span');
          dur.className = 'log-duration';
          dur.textContent = `${event.duration}ms`;
          entry.querySelector('.log-header').appendChild(dur);
        }

        // Add notification to canvas
        if (event.server === 'sim-robot' && this.renderer) {
          const world = this.evaluator.getWorld();
          const robot = world.robot;
          if (robot) {
            this.renderer.addNotification(
              `${event.tool}()`,
              robot.armX, robot.armY - 30,
              event.success ? COLORS.SUCCESS : COLORS.ERROR
            );
          }
        }

        // Mark web data events
        if (event.server === 'web-intel' && event.success) {
          this.evaluator.getWorld().addEvent('web_data_used', {});
        }

        const log = document.getElementById('activityLog');
        log.scrollTop = log.scrollHeight;
        break;
      }

      case 'eval_complete': {
        this.submission = event.submission;
        if (event.submission) {
          const card = document.getElementById('finalScoreCard');
          card.classList.remove('hidden');
          const scoreEl = document.getElementById('metricScore');
          scoreEl.textContent = `${event.submission.score}/100`;
          scoreEl.className = `score-value big grade-${event.submission.grade.toLowerCase()}`;

          // Update completion
          document.getElementById('metricCompletion').textContent =
            event.submission.breakdown.completion.detail;
          document.getElementById('completionFill').style.width =
            (event.submission.breakdown.completion.score / event.submission.breakdown.completion.max * 100) + '%';

          // Animate score reveal
          card.classList.add('score-reveal');
        }
        this.leaderboardData = event.leaderboard || [];
        break;
      }
    }
  }

  formatParams(params) {
    if (!params || Object.keys(params).length === 0) return '<span class="param-empty">{ }</span>';
    return Object.entries(params).map(([k, v]) =>
      `<span class="param-key">${k}</span><span class="param-eq">=</span><span class="param-val">${JSON.stringify(v)}</span>`
    ).join(' ');
  }

  showLanding() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.evaluator) this.evaluator.abort();
    this.renderLanding();
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  window.arena = new MCPArena();
});
