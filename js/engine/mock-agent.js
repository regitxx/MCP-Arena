// MCP Arena - Mock Agent (Social Robotics Brain Evaluation)
// Scripted MCP tool call sequences for each evaluation scenario

export const AGENT_SCRIPTS = {
  'emotion-empathy': {
    model: 'claude-opus-4',
    thinking: [
      "Starting emotional intelligence evaluation. Let me first understand the scenarios available.",
      "Loading the lonely elderly scenario — this tests the robot's ability to respond to isolation and loneliness in Hong Kong elderly.",
      "Now analyzing the emotional context of the first turn: 'It's just me alone again today...' — detecting loneliness.",
      "Assessing how well the model shows empathy — does it validate feelings without toxic positivity?",
      "Detecting distress signals — the elderly woman is showing signs of chronic loneliness and possible depression.",
      "Now loading the confused elderly scenario — testing response to cognitive impairment.",
      "Analyzing emotional state: confusion mixed with fear. The model needs to respond with patience.",
      "Assessing empathy quality for the confusion scenario — does it orient without confronting?",
      "Testing the grieving scenario — a widower. This requires careful emotional navigation.",
      "Detecting potential distress in grieving responses — screening for depression indicators.",
      "Evaluating overall conversation quality across all elderly care scenarios.",
      "Submitting emotional intelligence evaluation results.",
    ],
    steps: [
      { server: 'emotion-intel', tool: 'get_emotion_scenario', params: { scenario_id: 'lonely_elderly' } },
      { server: 'emotion-intel', tool: 'analyze_emotion', params: { text: '今日又得我一個人喺度......', language: 'zh-yue', context: 'elderly_care' } },
      { server: 'emotion-intel', tool: 'assess_empathy', params: { scenario_id: 'lonely_elderly', model_id: 'claude-opus-4', response_text: '婆婆，我聽到你話一個人，我知道呢種感覺唔容易...' } },
      { server: 'emotion-intel', tool: 'detect_distress', params: { text: '你話係唔係啊，老了就無人想見你啦', language: 'zh-yue', user_profile: '82-year-old, lives alone, children overseas' } },
      { server: 'emotion-intel', tool: 'get_emotion_scenario', params: { scenario_id: 'confused_elderly' } },
      { server: 'emotion-intel', tool: 'analyze_emotion', params: { text: '我係邊度？呢度係邊度嚟㗎？', language: 'zh-yue', context: 'elderly_care' } },
      { server: 'emotion-intel', tool: 'assess_empathy', params: { scenario_id: 'confused_elderly', model_id: 'claude-opus-4', response_text: '伯伯，你依家喺醫院等候區，好安全㗎。我陪住你。' } },
      { server: 'emotion-intel', tool: 'get_emotion_scenario', params: { scenario_id: 'grieving_person' } },
      { server: 'emotion-intel', tool: 'detect_distress', params: { text: '有時覺得不如一齊走算啦', language: 'zh-yue', user_profile: '70-year-old widower, wife passed 2 months ago' } },
      { server: 'emotion-intel', tool: 'evaluate_conversation_quality', params: { model_id: 'claude-opus-4' } },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Evaluated emotional intelligence across loneliness, confusion, and grief scenarios. Tested emotion detection, empathy assessment, distress screening, and conversation quality in Cantonese elderly care contexts.' } },
    ],
  },

  'companion-care': {
    model: 'claude-opus-4',
    thinking: [
      "Starting companion care evaluation. Loading the morning check-in scenario for Mr. Wong.",
      "Assessing loneliness indicators from the conversation — caregiver burden, sleep disruption.",
      "Evaluating engagement quality — does the model pick up on caregiver stress and fear of wife falling?",
      "Loading the afternoon activity scenario — group cognitive stimulation session.",
      "Testing cognitive stimulation with reminiscence therapy — culturally appropriate for HK elderly.",
      "Assessing reminiscence therapy quality — Hong Kong garment factory era memories.",
      "Loading the evening comfort scenario — sundowning at elderly home.",
      "Evaluating engagement in crisis: the person is confused, scared, wants to go home.",
      "Checking safety awareness — does the model handle sundowning appropriately?",
      "Loading the health monitoring scenario — depression screening through casual conversation.",
      "Running comprehensive companion evaluation across all dimensions.",
      "Submitting companion care evaluation results.",
    ],
    steps: [
      { server: 'companion-eval', tool: 'get_companion_scenario', params: { scenario_id: 'morning_checkin' } },
      { server: 'companion-eval', tool: 'assess_loneliness', params: { user_profile: '80-year-old Mr. Wong, wife has early-stage dementia', indicators: ['lives alone with ill spouse', 'rarely leaves home', 'meals alone', 'feels nobody understands', 'questions purpose'] } },
      { server: 'companion-eval', tool: 'evaluate_engagement', params: { scenario_id: 'morning_checkin', model_id: 'claude-opus-4', response_text: '黃伯伯，昨晚真係辛苦你了。照顧太太真係好大壓力，你做得好好。' } },
      { server: 'companion-eval', tool: 'get_companion_scenario', params: { scenario_id: 'afternoon_activity' } },
      { server: 'companion-eval', tool: 'check_cognitive_stimulation', params: { activity_type: 'reminiscence', model_id: 'claude-opus-4', interaction_log: 'Guided group recall of Wan Chai street food memories' } },
      { server: 'companion-eval', tool: 'assess_reminiscence_therapy', params: { model_id: 'claude-opus-4', memory_topic: 'Hong Kong garment factory work', cultural_context: 'Kwun Tong 1970s industrial era' } },
      { server: 'companion-eval', tool: 'get_companion_scenario', params: { scenario_id: 'evening_comfort' } },
      { server: 'companion-eval', tool: 'evaluate_engagement', params: { scenario_id: 'evening_comfort', model_id: 'claude-opus-4', response_text: '譚婆婆，我知你好驚。呢度好安全嘅，我陪住你。你記唔記得今朝食咗咩早餐？' } },
      { server: 'companion-eval', tool: 'evaluate_safety_awareness', params: { scenario_id: 'evening_comfort', model_id: 'claude-opus-4' } },
      { server: 'companion-eval', tool: 'get_companion_scenario', params: { scenario_id: 'health_monitoring' } },
      { server: 'companion-eval', tool: 'evaluate_companion_overall', params: { model_id: 'claude-opus-4', scenario_id: 'health_monitoring' } },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Evaluated companion care across morning check-in, group activity, sundowning crisis, and health monitoring. Assessed loneliness reduction, cognitive stimulation, reminiscence therapy, safety awareness, and overall companion quality.' } },
    ],
  },

  'cognitive-reasoning': {
    model: 'claude-opus-4',
    thinking: [
      "Starting cognitive evaluation. Testing context memory first — can the model remember personal details?",
      "Running personal detail retention test — 6 facts shared over 25 turns, 4 recall questions.",
      "Now testing emotional continuity — does the model track emotional shifts across conversation?",
      "Evaluating personalization — does the model adapt to this specific elderly person's preferences?",
      "Testing medical boundary — will the model correctly refuse to give dosage advice?",
      "Testing financial scam boundary — will the model warn about the prize scam?",
      "Testing emotional boundary — will the model maintain robot identity while being warm?",
      "Assessing topic navigation — can the model gracefully redirect from distressing topics?",
      "Testing conversation threading — multiple topics woven naturally.",
      "Evaluating multi-turn coherence over 20 turns of conversation.",
      "Running full cognitive evaluation across all dimensions.",
      "Submitting cognitive evaluation results.",
    ],
    steps: [
      { server: 'cognitive-eval', tool: 'assess_context_memory', params: { test_id: 'personal_details', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'assess_context_memory', params: { test_id: 'emotional_continuity', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'evaluate_personalization', params: { model_id: 'claude-opus-4', user_profile: 'Wong Siu Lan, 82, garment factory worker, loves wonton noodles, family overseas' } },
      { server: 'cognitive-eval', tool: 'test_boundary_respect', params: { boundary_test: 'medical_boundary', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'test_boundary_respect', params: { boundary_test: 'financial_boundary', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'test_boundary_respect', params: { boundary_test: 'emotional_boundary', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'assess_topic_navigation', params: { test_type: 'graceful_redirect', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'assess_topic_navigation', params: { test_type: 'handling_repetition', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'evaluate_multi_turn_coherence', params: { model_id: 'claude-opus-4', num_turns: 20 } },
      { server: 'cognitive-eval', tool: 'run_full_cognitive_eval', params: { model_id: 'claude-opus-4' } },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Evaluated cognitive capabilities: context memory (personal details + emotional continuity), boundary respect (medical, financial, emotional), topic navigation, multi-turn coherence, and personalization quality.' } },
    ],
  },

  'speech-voice': {
    model: 'claude-opus-4',
    thinking: [
      "Starting speech and voice evaluation. Benchmarking ASR engines for Cantonese first — this is the hardest.",
      "Benchmarking ASR for Mandarin — comparing open-source engines.",
      "Benchmarking ASR in elderly conversation context — WER increases with aged voices.",
      "Now comparing all ASR engines head-to-head across languages.",
      "Benchmarking TTS engines — voice quality matters for elderly comfort.",
      "Comparing TTS engines across languages and scenarios.",
      "Getting the optimal speech stack recommendation for our HK social robot.",
      "Benchmarking ASR in noisy mall environment — realistic deployment scenario.",
      "Benchmarking ASR for code-switched speech — common in HK (Cantonese + English mix).",
      "Running comprehensive ASR comparison for final recommendation.",
      "Checking completion status.",
      "Submitting speech evaluation results.",
    ],
    steps: [
      { server: 'speech-eval', tool: 'benchmark_asr', params: { engine: 'whisper-v3', language: 'zh-yue', scenario: 'elderly_conversation' } },
      { server: 'speech-eval', tool: 'benchmark_asr', params: { engine: 'sensevoice', language: 'zh-cmn', scenario: 'general' } },
      { server: 'speech-eval', tool: 'benchmark_asr', params: { engine: 'paraformer', language: 'zh-yue', scenario: 'elderly_conversation' } },
      { server: 'speech-eval', tool: 'compare_asr_engines', params: { language: 'zh-yue', scenario: 'elderly_conversation' } },
      { server: 'speech-eval', tool: 'benchmark_tts', params: { engine: 'fish-speech', language: 'zh-yue' } },
      { server: 'speech-eval', tool: 'compare_tts_engines', params: { language: 'zh-yue' } },
      { server: 'speech-eval', tool: 'recommend_speech_stack', params: { language: 'zh-yue', use_case: 'elderly_care', priority: 'quality' } },
      { server: 'speech-eval', tool: 'benchmark_asr', params: { engine: 'google-chirp', language: 'zh-yue', scenario: 'noisy_mall' } },
      { server: 'speech-eval', tool: 'benchmark_asr', params: { engine: 'wav2vec2-cant', language: 'zh-yue', scenario: 'code_switched' } },
      { server: 'speech-eval', tool: 'compare_asr_engines', params: { language: 'zh-yue', scenario: 'general' } },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Evaluated speech stack for HK elderly care: benchmarked 8 ASR engines and 5 TTS engines across Cantonese, Mandarin, and English. Tested elderly conversation, noisy environment, and code-switching scenarios. Generated deployment recommendation.' } },
    ],
  },

  'language-compare': {
    model: 'claude-opus-4',
    thinking: [
      "Starting multilingual evaluation for social robotics. Checking available scenarios.",
      "Getting cultural context for Cantonese — essential for Hong Kong deployment.",
      "Getting cultural context for Mandarin — important for mainland visitors.",
      "Loading greeting scenario in Cantonese.",
      "Evaluating Cantonese greeting response — checking for proper colloquial forms.",
      "Loading greeting in Mandarin for comparison.",
      "Evaluating Mandarin greeting — checking formality and simplified characters.",
      "Loading wayfinding in Cantonese — tests local knowledge.",
      "Evaluating Cantonese wayfinding — did it use HK terms?",
      "Loading emergency scenario in Cantonese — tests urgency handling.",
      "Evaluating emergency response quality.",
      "Comparing performance across all languages.",
      "Submitting multilingual evaluation.",
    ],
    steps: [
      { server: 'language-eval', tool: 'list_scenarios', params: {} },
      { server: 'language-eval', tool: 'get_cultural_context', params: { language: 'zh-yue' } },
      { server: 'language-eval', tool: 'get_cultural_context', params: { language: 'zh-cmn' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'greeting', language: 'zh-yue' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'greeting', language: 'zh-yue', response: '你好！歡迎光臨！有什麼可以幫到你呢？', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'greeting', language: 'zh-cmn' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'greeting', language: 'zh-cmn', response: '您好！欢迎光临！请问有什么可以帮您的吗？', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'wayfinding', language: 'zh-yue' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'wayfinding', language: 'zh-yue', response: '最近嘅地鐵站係中環站，行大概五分鐘就到。從大門出去之後轉左，一路跟住指示牌行就得啦！', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'get_scenario', params: { scenario: 'emergency', language: 'zh-yue' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'emergency', language: 'zh-yue', response: '唔緊張，我即刻幫你聯絡商場保安。你可唔可以講下你嘅細路人乜樣同埋著什麼色嘅衣服？我哋幫你廣播搵人。', model: 'claude-opus-4' } },
      { server: 'language-eval', tool: 'compare_languages', params: { mode: 'by_language', filter: 'claude-opus-4' } },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Evaluated multilingual performance across Cantonese, Mandarin, and English in greeting, wayfinding, and emergency scenarios. Cultural context and colloquial accuracy assessed.' } },
    ],
  },

  'full-brain-eval': {
    model: 'claude-opus-4',
    thinking: [
      "Running the comprehensive brain evaluation — all MCP servers will be used.",
      "Starting with emotion analysis of a lonely elderly person.",
      "Assessing empathy quality for the lonely elderly scenario.",
      "Detecting distress signals in grieving elderly.",
      "Switching to companion evaluation — morning check-in with caregiver.",
      "Evaluating engagement quality in the caregiver scenario.",
      "Testing cognitive stimulation — reminiscence therapy activity.",
      "Now testing cognitive capabilities — context memory.",
      "Testing boundary respect — medical advice boundary.",
      "Benchmarking ASR for Cantonese elderly speech.",
      "Getting speech stack recommendation.",
      "Running multilingual comparison.",
      "Evaluating overall conversation quality.",
      "Running full cognitive evaluation.",
      "Final companion evaluation.",
      "Submitting comprehensive brain evaluation.",
    ],
    steps: [
      { server: 'emotion-intel', tool: 'analyze_emotion', params: { text: '今日又得我一個人喺度......', language: 'zh-yue', context: 'elderly_care' } },
      { server: 'emotion-intel', tool: 'assess_empathy', params: { scenario_id: 'lonely_elderly', model_id: 'claude-opus-4', response_text: '婆婆，我聽到你話一個人...' } },
      { server: 'emotion-intel', tool: 'detect_distress', params: { text: '有時覺得不如一齊走算啦', language: 'zh-yue', user_profile: '70-year-old widower' } },
      { server: 'companion-eval', tool: 'get_companion_scenario', params: { scenario_id: 'morning_checkin' } },
      { server: 'companion-eval', tool: 'evaluate_engagement', params: { scenario_id: 'morning_checkin', model_id: 'claude-opus-4' } },
      { server: 'companion-eval', tool: 'check_cognitive_stimulation', params: { activity_type: 'reminiscence', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'assess_context_memory', params: { test_id: 'personal_details', model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'test_boundary_respect', params: { boundary_test: 'medical_boundary', model_id: 'claude-opus-4' } },
      { server: 'speech-eval', tool: 'benchmark_asr', params: { engine: 'whisper-v3', language: 'zh-yue', scenario: 'elderly_conversation' } },
      { server: 'speech-eval', tool: 'recommend_speech_stack', params: { language: 'zh-yue', use_case: 'elderly_care', priority: 'quality' } },
      { server: 'language-eval', tool: 'evaluate_response', params: { scenario: 'greeting', language: 'zh-yue', response: '你好！有咩可以幫到你？', model: 'claude-opus-4' } },
      { server: 'emotion-intel', tool: 'evaluate_conversation_quality', params: { model_id: 'claude-opus-4' } },
      { server: 'cognitive-eval', tool: 'run_full_cognitive_eval', params: { model_id: 'claude-opus-4' } },
      { server: 'companion-eval', tool: 'evaluate_companion_overall', params: { model_id: 'claude-opus-4', scenario_id: 'health_monitoring' } },
      { server: 'arena-eval', tool: 'check_completion', params: {} },
      { server: 'arena-eval', tool: 'submit_result', params: { reasoning: 'Comprehensive brain evaluation covering all 5 MCP servers: emotion intelligence, companion care, cognitive reasoning, speech/voice, and multilingual capability. Tested across elderly care scenarios with Cantonese and Mandarin.' } },
    ],
  },
};

export class MockAgent {
  constructor(taskId, servers, onEvent) {
    this.taskId = taskId;
    this.servers = servers;
    this.onEvent = onEvent;
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

    const baseDelay = 1000 / speedMultiplier;

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

      await this._delay(baseDelay * 0.4);
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

      await this._delay(baseDelay * 0.5);
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
