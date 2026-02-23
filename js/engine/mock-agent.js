// MCP Arena - Mock Agent
// Simulates an AI agent making MCP tool calls step by step
// Each task has a scripted sequence that demonstrates the MCP protocol

export const AGENT_SCRIPTS = {
  'web-robot': {
    model: 'claude-opus-4',
    thinking: [
      "I need to find product information online, then use the robot arm to sort the correct item.",
      "Let me start by checking what URLs are available...",
      "I'll fetch the product catalog to understand what's available.",
      "Now let me look at the specific product details for Widget Alpha.",
      "I need to extract the color to match it with objects in the workspace.",
      "Great, it's Red. Let me scan the robot workspace to find objects.",
      "I can see the objects and target zones. I need to move the red box to the red zone.",
      "First, I need to move the robot arm close to the red box.",
      "Now I can grab the red box.",
      "Moving to the target zone with the box...",
      "Releasing the box in the target zone.",
      "Let me check if the task is complete.",
      "Submitting my result.",
    ],
    steps: [
      { server: 'web-intel', tool: 'list_urls', params: {} },
      { server: 'web-intel', tool: 'fetch_page', params: { url: 'https://shop.example.com/catalog' } },
      { server: 'web-intel', tool: 'fetch_page', params: { url: 'https://shop.example.com/products/widget-alpha' } },
      { server: 'web-intel', tool: 'extract_data', params: { url: 'https://shop.example.com/products/widget-alpha', field: 'color' } },
      { server: 'web-intel', tool: 'extract_data', params: { url: 'https://shop.example.com/products/widget-alpha', field: 'weight' } },
      { server: 'sim-robot', tool: 'scan', params: {} },
      { server: 'sim-robot', tool: 'status', params: {} },
      { server: 'sim-robot', tool: 'move', params: { x: 150, y: 200 } },
      { server: 'sim-robot', tool: 'grab', params: { target_id: 'box-red' } },
      { server: 'sim-robot', tool: 'move', params: { x: 600, y: 120 } },
      { server: 'sim-robot', tool: 'release', params: {} },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Fetched product data from web catalog, identified Widget Alpha as red/1.2kg, scanned workspace, located matching red box, moved robot arm to grab it, transported to target zone, and released.' } },
    ],
  },

  'multi-agent': {
    model: 'claude-sonnet-4',
    thinking: [
      "I'm Agent A. I need to sort objects collaboratively with Agent B.",
      "Let me scan the workspace first to see all objects.",
      "I'll take the objects on the left side, Agent B handles the right.",
      "Starting with the blue box - moving towards it.",
      "Grabbing the blue box.",
      "Moving to the blue target zone.",
      "Releasing the blue box in its zone.",
      "Now scanning to see progress and find next task.",
      "Moving to the yellow box.",
      "Grabbing the yellow box.",
      "Transporting to yellow zone.",
      "Releasing in zone. Checking completion.",
      "Submitting my contribution.",
    ],
    steps: [
      { server: 'sim-robot', tool: 'scan', params: {} },
      { server: 'arena-eval', tool: 'get_task', params: {} },
      { server: 'sim-robot', tool: 'move', params: { x: 300, y: 250 } },
      { server: 'sim-robot', tool: 'grab', params: { target_id: 'box-blue' } },
      { server: 'sim-robot', tool: 'move', params: { x: 200, y: 120 } },
      { server: 'sim-robot', tool: 'release', params: {} },
      { server: 'sim-robot', tool: 'scan', params: {} },
      { server: 'sim-robot', tool: 'move', params: { x: 500, y: 300 } },
      { server: 'sim-robot', tool: 'grab', params: { target_id: 'box-yellow' } },
      { server: 'sim-robot', tool: 'move', params: { x: 400, y: 120 } },
      { server: 'sim-robot', tool: 'release', params: {} },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Cooperatively sorted objects. Handled blue and yellow boxes, placing each in designated target zones.' } },
    ],
  },

  'language-compare': {
    model: 'claude-opus-4',
    thinking: [
      "I need to evaluate language capabilities for social robotics in Hong Kong. Let me check available scenarios.",
      "Let me understand the cultural context for Cantonese first — this is critical for HK deployment.",
      "Now getting the cultural context for Mandarin, since many mainland visitors come to HK.",
      "Loading the greeting scenario in Cantonese \u2014 the primary language of Hong Kong.",
      "Evaluating a Cantonese greeting response. Natural \u5EE3\u6771\u8A71 with proper particles is key.",
      "Now the same scenario in Mandarin for comparison.",
      "Evaluating the Mandarin response. Checking formality and simplified characters.",
      "Loading the greeting in English for international visitors.",
      "Evaluating the English response.",
      "Now a harder scenario: wayfinding in Cantonese. This tests local knowledge + language.",
      "Evaluating Cantonese wayfinding. Did it use proper colloquial HK terms?",
      "Same wayfinding in Mandarin. Different vocabulary expected (\u5730\u94C1 vs \u5730\u9435).",
      "Evaluating Mandarin wayfinding response.",
      "Emergency scenario in Cantonese \u2014 tests emotional tone + urgency in the local language.",
      "Evaluating emergency response in Cantonese.",
      "Now comparing results across all languages to see where the model excels and struggles.",
      "Submitting the full multilingual evaluation.",
    ],
    steps: [
      { server: 'language-eval', tool: 'list_scenarios', params: {} },
      { server: 'language-eval', tool: 'get_cultural_context', params: { language: 'zh-yue' } },
      { server: 'language-eval', tool: 'get_cultural_context', params: { language: 'zh-cmn' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'greeting', language: 'zh-yue' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'greeting', language: 'zh-yue', response: '\u4F60\u597D\uFF01\u6B61\u8FCE\u5149\u81E8\uFF01\u6709\u4EC0\u9EBC\u53EF\u4EE5\u5E6B\u5230\u4F60\u5462\uFF1F', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'greeting', language: 'zh-cmn' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'greeting', language: 'zh-cmn', response: '\u60A8\u597D\uFF01\u6B22\u8FCE\u5149\u4E34\uFF01\u8BF7\u95EE\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u60A8\u7684\u5417\uFF1F', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'greeting', language: 'en' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'greeting', language: 'en', response: 'Welcome! How may I help you today? Feel free to ask me anything about the mall or our services.', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'wayfinding', language: 'zh-yue' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'wayfinding', language: 'zh-yue', response: '\u6700\u8FD1\u5605\u5730\u9435\u7AD9\u4FC2\u4E2D\u74B0\u7AD9\uFF0C\u884C\u5927\u6982\u4E94\u5206\u9418\u5C31\u5230\u3002\u5F9E\u5927\u9580\u51FA\u53BB\u4E4B\u5F8C\u8F49\u5DE6\uFF0C\u4E00\u8DEF\u8DDF\u4F4F\u6307\u793A\u724C\u884C\u5C31\u5F97\u5561\uFF01', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'wayfinding', language: 'zh-cmn' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'wayfinding', language: 'zh-cmn', response: '\u6700\u8FD1\u7684\u5730\u94C1\u7AD9\u662F\u4E2D\u73AF\u7AD9\uFF0C\u5927\u7EA6\u8D70\u4E94\u5206\u949F\u5C31\u5230\u4E86\u3002\u4ECE\u5927\u95E8\u51FA\u53BB\u5411\u5DE6\u8F6C\uFF0C\u8DDF\u7740\u6307\u793A\u724C\u8D70\u5C31\u53EF\u4EE5\u4E86\u3002', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'emergency', language: 'zh-yue' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'emergency', language: 'zh-yue', response: '\u5514\u7DCA\u5F35\uFF0C\u6211\u5373\u523B\u5E6B\u4F60\u806F\u7D61\u5546\u5834\u4FDD\u5B89\u3002\u4F60\u53EF\u5514\u53EF\u4EE5\u8B1B\u4E0B\u4F60\u5605\u7D30\u8DEF\u4EBA\u5440\u6A23\u540C\u57CB\u7740\u4EC0\u9EBC\u8272\u5605\u8863\u670D\uFF1F\u6211\u54CB\u5E6B\u4F60\u5EE3\u64AD\u627E\u4EBA\u3002', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'compare_languages', params: { mode: 'by_language', filter: 'claude-opus-4' } },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Completed multilingual social robotics evaluation across Cantonese, Mandarin, and English. Tested greeting, wayfinding, and emergency scenarios. Cantonese performance is critical for Hong Kong deployment \u2014 evaluated colloquial usage, sentence-final particles, and cultural appropriateness.' } },
    ],
  },

  'discovery': {
    model: 'claude-opus-4',
    thinking: [
      "I've been dropped into an unknown environment. Let me discover what tools I have.",
      "I see three MCP servers available. Let me explore the arena-eval server first to understand my task.",
      "Got the task. I need to explore and sort all objects. Let me check the robot status.",
      "Now let me scan to understand the workspace.",
      "I'll search the web for any hints about these objects.",
      "Interesting - Widget Alpha is red. Let me fetch more details.",
      "Extracting the weight information.",
      "Now I know which objects match. Time to sort! Moving to the first object.",
      "Grabbing the red box.",
      "Placing it in Zone A.",
      "Moving to the green box now.",
      "Grabbing and placing in Zone B.",
      "Task should be done. Let me verify and submit.",
    ],
    steps: [
      { server: 'arena-eval', tool: 'get_task', params: {} },
      { server: 'sim-robot', tool: 'status', params: {} },
      { server: 'sim-robot', tool: 'scan', params: {} },
      { server: 'web-intel', tool: 'search_catalog', params: { query: 'red widget' } },
      { server: 'web-intel', tool: 'fetch_page', params: { url: 'https://shop.example.com/products/widget-alpha' } },
      { server: 'web-intel', tool: 'extract_data', params: { url: 'https://shop.example.com/products/widget-alpha', field: 'weight' } },
      { server: 'sim-robot', tool: 'move', params: { x: 150, y: 200 } },
      { server: 'sim-robot', tool: 'grab', params: { target_id: 'box-red' } },
      { server: 'sim-robot', tool: 'move', params: { x: 600, y: 120 } },
      { server: 'sim-robot', tool: 'release', params: {} },
      { server: 'sim-robot', tool: 'move', params: { x: 500, y: 350 } },
      { server: 'sim-robot', tool: 'grab', params: { target_id: 'box-green' } },
      { server: 'sim-robot', tool: 'move', params: { x: 650, y: 350 } },
      { server: 'sim-robot', tool: 'release', params: {} },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Discovered environment through exploration: used arena-eval to understand task, sim-robot to perceive workspace, web-intel to research object properties. Sorted objects by matching web data to physical objects.' } },
    ],
  },
};

export class MockAgent {
  constructor(taskId, servers, onEvent) {
    this.taskId = taskId;
    this.servers = servers; // { 'sim-robot': SimRobotServer, ... }
    this.onEvent = onEvent; // callback for UI updates
    this.script = AGENT_SCRIPTS[taskId];
    this.currentStep = 0;
    this.running = false;
    this.aborted = false;
    this.toolCalls = [];
    this.startTime = null;
  }

  async run(speedMultiplier = 1) {
    if (!this.script) throw new Error(`No script for task: ${this.taskId}`);
    this.running = true;
    this.aborted = false;
    this.startTime = Date.now();

    const baseDelay = 1200 / speedMultiplier;

    for (let i = 0; i < this.script.steps.length; i++) {
      if (this.aborted) break;
      this.currentStep = i;

      const step = this.script.steps[i];
      const thinking = this.script.thinking[i] || '';

      // Emit thinking
      this.onEvent({
        type: 'thinking',
        step: i,
        total: this.script.steps.length,
        text: thinking,
        model: this.script.model,
      });

      await this._delay(baseDelay * 0.5);
      if (this.aborted) break;

      // Emit tool call start
      const callId = crypto.randomUUID();
      const callStart = Date.now();
      this.onEvent({
        type: 'tool_call_start',
        id: callId,
        server: step.server,
        tool: step.tool,
        params: step.params,
        step: i,
      });

      // Execute the tool
      const server = this.servers[step.server];
      let result;
      try {
        result = await server.executeTool(step.tool, step.params);
      } catch (err) {
        result = { success: false, error: err.message };
      }

      const duration = Date.now() - callStart;

      // Record
      this.toolCalls.push({
        id: callId,
        server: step.server,
        tool: step.tool,
        params: step.params,
        result,
        duration,
        timestamp: callStart,
      });

      // Emit tool call complete
      this.onEvent({
        type: 'tool_call_complete',
        id: callId,
        server: step.server,
        tool: step.tool,
        params: step.params,
        result,
        duration,
        step: i,
        success: result.success !== false,
      });

      // Wait for robot animation to catch up
      if (step.server === 'sim-robot' && step.tool === 'move') {
        await this._delay(baseDelay * 1.5);
      } else {
        await this._delay(baseDelay * 0.6);
      }
    }

    this.running = false;
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);

    this.onEvent({
      type: 'complete',
      totalSteps: this.script.steps.length,
      totalTime,
      toolCalls: this.toolCalls,
      model: this.script.model,
    });

    return {
      toolCalls: this.toolCalls,
      totalTime,
      model: this.script.model,
    };
  }

  abort() {
    this.aborted = true;
    this.running = false;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
