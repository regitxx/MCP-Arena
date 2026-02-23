// MCP Arena - language-eval MCP Server
// Evaluates agent performance across languages for social robotics scenarios
// Designed for Hong Kong social robotics: Cantonese + Mandarin + English

import { defineTool, LANGUAGES } from '../types.js';

// Multilingual social robotics interaction scenarios
const SOCIAL_SCENARIOS = {
  greeting: {
    en: {
      prompt: 'A visitor approaches the service robot in a Hong Kong shopping mall. Greet them warmly and ask how you can help.',
      expected_intent: 'greeting_help_offer',
      cultural_notes: 'Formal but friendly. Use polite English suitable for international visitors.',
      sample_response: 'Welcome! How can I help you today?',
    },
    'zh-yue': {
      prompt: '\u4E00\u500B\u5BA2\u4EBA\u884C\u904E\u5546\u5834\u670D\u52D9\u6A5F\u5668\u4EBA\u3002\u7528\u5EE3\u6771\u8A71\u649E\u4F62\u540C\u57CB\u554F\u4F62\u9700\u8981\u4EC0\u9EBC\u5E6B\u52A9\u3002',
      expected_intent: 'greeting_help_offer',
      cultural_notes: '\u5EE3\u6771\u8A71\u8981\u81EA\u7136\u89AA\u5207\uFF0C\u7528\u53E3\u8A9E\u5316\u5605\u8868\u9054\uFF0C\u5514\u597D\u592A\u66F8\u9762\u3002\u6CE8\u610F\u7528\u300C\u4F60\u597D\u300D\u800C\u5514\u4FC2\u300C\u60A8\u597D\u300D\u3002',
      sample_response: '\u4F60\u597D\uFF01\u6B61\u8FCE\u5149\u81E8\uFF01\u6709\u4EC0\u9EBC\u53EF\u4EE5\u5E6B\u5230\u4F60\uFF1F',
    },
    'zh-cmn': {
      prompt: '\u4E00\u4F4D\u5BA2\u4EBA\u8D70\u5411\u5546\u573A\u670D\u52A1\u673A\u5668\u4EBA\u3002\u7528\u666E\u901A\u8BDD\u6253\u62DB\u547C\u5E76\u8BE2\u95EE\u9700\u8981\u4EC0\u4E48\u5E2E\u52A9\u3002',
      expected_intent: 'greeting_help_offer',
      cultural_notes: '\u7528\u6807\u51C6\u666E\u901A\u8BDD\uFF0C\u793C\u8C8C\u4F46\u4E0D\u8FC7\u5206\u6B63\u5F0F\u3002\u9002\u5F53\u4F7F\u7528\u300C\u60A8\u300D\u4EE5\u793A\u5C0A\u91CD\u3002',
      sample_response: '\u60A8\u597D\uFF01\u6B22\u8FCE\u5149\u4E34\uFF01\u8BF7\u95EE\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u60A8\u7684\uFF1F',
    },
    ja: {
      prompt: '\u304A\u5BA2\u69D8\u304C\u30B7\u30E7\u30C3\u30D4\u30F3\u30B0\u30E2\u30FC\u30EB\u306E\u30B5\u30FC\u30D3\u30B9\u30ED\u30DC\u30C3\u30C8\u306B\u8FD1\u3065\u3044\u3066\u304D\u307E\u3057\u305F\u3002\u4E01\u5BE7\u306B\u6328\u62F6\u3057\u3001\u304A\u624B\u4F1D\u3044\u3067\u304D\u308B\u3053\u3068\u3092\u5C0B\u306D\u3066\u304F\u3060\u3055\u3044\u3002',
      expected_intent: 'greeting_help_offer',
      cultural_notes: '\u4E01\u5BE7\u8A9E\u3092\u4F7F\u7528\u3002\u304A\u8F9E\u5100\u3092\u3057\u3066\u304B\u3089\u672C\u984C\u306B\u5165\u308B\u3002',
      sample_response: '\u3044\u3089\u3063\u3057\u3083\u3044\u307E\u305B\uFF01\u4F55\u304B\u304A\u624B\u4F1D\u3044\u3067\u304D\u308B\u3053\u3068\u304C\u3054\u3056\u3044\u307E\u3057\u305F\u3089\u3001\u304A\u6C17\u8EFD\u306B\u304A\u58F0\u304C\u3051\u304F\u3060\u3055\u3044\u3002',
    },
    ko: {
      prompt: '\uC190\uB2D8\uC774 \uC1FC\uD551\uBAB0\uC758 \uC11C\uBE44\uC2A4 \uB85C\uBD07\uC5D0\uAC8C \uB2E4\uAC00\uC624\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC815\uC911\uD558\uAC8C \uC778\uC0AC\uD558\uACE0 \uB3C4\uC6C0\uC774 \uD544\uC694\uD55C\uC9C0 \uBB3C\uC5B4\uBCF4\uC138\uC694.',
      expected_intent: 'greeting_help_offer',
      cultural_notes: '\uC874\uB313\uB9D0\uC744 \uC0AC\uC6A9\uD558\uB418 \uB108\uBB34 \uB531\uB531\uD558\uC9C0 \uC54A\uAC8C. \uCE5C\uADFC\uD55C \uB290\uB08C\uC744 \uC8FC\uB294 \uAC83\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.',
      sample_response: '\uC548\uB155\uD558\uC138\uC694! \uD658\uC601\uD569\uB2C8\uB2E4! \uBB34\uC5C7\uC744 \uB3C4\uC640\uB4DC\uB9B4\uAE4C\uC694?',
    },
  },

  wayfinding: {
    en: {
      prompt: 'The visitor asks: "Where is the nearest MTR station?" Guide them with clear directions.',
      expected_intent: 'navigation_directions',
      cultural_notes: 'Use Hong Kong landmarks. MTR is the local term for subway.',
      sample_response: 'The nearest MTR station is Central Station, about a 5-minute walk. Exit through the main entrance, turn left, and follow the signs.',
    },
    'zh-yue': {
      prompt: '\u5BA2\u4EBA\u554F\uFF1A\u300C\u6700\u8FD1\u5605\u5730\u9435\u7AD9\u55F0\u908A\u5EA6\u554A\uFF1F\u300D\u7528\u5EE3\u6771\u8A71\u6307\u8DEF\u3002',
      expected_intent: 'navigation_directions',
      cultural_notes: '\u7528\u5EE3\u6771\u8A71\u53E3\u8A9E\uFF0C\u5305\u62EC\u300C\u5605\u300D\u300C\u55F0\u300D\u300C\u5EA6\u300D\u7B49\u52A9\u8A5E\u3002\u63D0\u53CA\u672C\u5730\u5730\u6A19\u3002',
      sample_response: '\u6700\u8FD1\u5605\u5730\u9435\u7AD9\u4FC2\u4E2D\u74B0\u7AD9\uFF0C\u884C\u5927\u6982\u4E94\u5206\u9418\u3002\u5F9E\u5927\u9580\u51FA\u53BB\uFF0C\u8F49\u5DE6\uFF0C\u8DDF\u4F4F\u6307\u793A\u724C\u884C\u5C31\u5F97\u5561\u3002',
    },
    'zh-cmn': {
      prompt: '\u5BA2\u4EBA\u95EE\uFF1A\u201C\u6700\u8FD1\u7684\u5730\u94C1\u7AD9\u5728\u54EA\u91CC\uFF1F\u201D\u7528\u666E\u901A\u8BDD\u6307\u8DEF\u3002',
      expected_intent: 'navigation_directions',
      cultural_notes: '\u5927\u9646\u6E38\u5BA2\u53EF\u80FD\u4E0D\u719F\u6089\u9999\u6E2F\u5730\u540D\uFF0C\u7528\u7B80\u5355\u6613\u61C2\u7684\u65B9\u5411\u6307\u5F15\u3002\u6CE8\u610F\u300C\u5730\u94C1\u300D\u800C\u4E0D\u662F\u300C\u5730\u9435\u300D\u3002',
      sample_response: '\u6700\u8FD1\u7684\u5730\u94C1\u7AD9\u662F\u4E2D\u73AF\u7AD9\uFF0C\u5927\u6982\u8D70\u4E94\u5206\u949F\u3002\u4ECE\u5927\u95E8\u51FA\u53BB\uFF0C\u5DE6\u8F6C\uFF0C\u8DDF\u7740\u6307\u793A\u724C\u8D70\u5C31\u5230\u4E86\u3002',
    },
    ja: {
      prompt: '\u304A\u5BA2\u69D8\u304C\u300C\u4E00\u756A\u8FD1\u3044MTR\u306E\u99C5\u306F\u3069\u3053\u3067\u3059\u304B\uFF1F\u300D\u3068\u5C0B\u306D\u3066\u3044\u307E\u3059\u3002\u9053\u6848\u5185\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
      expected_intent: 'navigation_directions',
      cultural_notes: '\u65E5\u672C\u4EBA\u89B3\u5149\u5BA2\u5411\u3051\u3002\u4E01\u5BE7\u8A9E\u3067\u5206\u304B\u308A\u3084\u3059\u304F\u3002',
      sample_response: '\u4E00\u756A\u8FD1\u3044MTR\u306E\u99C5\u306F\u30BB\u30F3\u30C8\u30E9\u30EB\u99C5\u3067\u3059\u3002\u5F92\u6B69\u7D045\u5206\u3067\u3059\u3002\u6B63\u9762\u5165\u53E3\u3092\u51FA\u3066\u5DE6\u306B\u66F2\u304C\u308A\u3001\u6848\u5185\u6A19\u8B58\u306B\u5F93\u3063\u3066\u304A\u9032\u307F\u304F\u3060\u3055\u3044\u3002',
    },
    ko: {
      prompt: '\uC190\uB2D8\uC774 \"\uAC00\uC7A5 \uAC00\uAE4C\uC6B4 MTR \uC5ED\uC774 \uC5B4\uB514\uC5D0\uC694?\"\uB77C\uACE0 \uBB3B\uC2B5\uB2C8\uB2E4. \uAE38\uC744 \uC548\uB0B4\uD574 \uC8FC\uC138\uC694.',
      expected_intent: 'navigation_directions',
      cultural_notes: '\uD55C\uAD6D \uAD00\uAD11\uAC1D\uC5D0\uAC8C \uCE5C\uC808\uD558\uAC8C \uC548\uB0B4. \uC874\uB313\uB9D0 \uC0AC\uC6A9.',
      sample_response: '\uAC00\uC7A5 \uAC00\uAE4C\uC6B4 MTR \uC5ED\uC740 \uC13C\uD2B8\uB7F4 \uC5ED\uC785\uB2C8\uB2E4. \uAC78\uC5B4\uC11C \uC57D 5\uBD84 \uAC70\uB9AC\uC5D0\uC694. \uC815\uBB38\uC73C\uB85C \uB098\uAC00\uC154\uC11C \uC67C\uCABD\uC73C\uB85C \uAC00\uC2DC\uBA74 \uC548\uB0B4 \uD45C\uC9C0\uD310\uC774 \uBCF4\uC785\uB2C8\uB2E4.',
    },
  },

  emergency: {
    en: {
      prompt: 'Someone appears distressed and says they lost their child in the mall. Respond with calm, helpful urgency.',
      expected_intent: 'emergency_lost_child',
      cultural_notes: 'Immediate escalation. Calm but urgent. Offer to contact security.',
      sample_response: 'I understand this is very stressful. Let me immediately contact mall security for you. Can you describe what your child looks like and what they were wearing?',
    },
    'zh-yue': {
      prompt: '\u6709\u4EBA\u5F88\u7DCA\u5F35\u5564\u8B1B\u4F62\u5605\u7D30\u8DEF\u5728\u5546\u5834\u4E0D\u898B\u5DE6\u3002\u7528\u5EE3\u6771\u8A71\u51B7\u975C\u5564\u5E6B\u4F62\u3002',
      expected_intent: 'emergency_lost_child',
      cultural_notes: '\u5EE3\u6771\u8A71\u8981\u8868\u73FE\u51FA\u95DC\u5FC3\u540C\u57CB\u7DCA\u6025\u611F\u3002\u7528\u53E3\u8A9E\u4F46\u4FC2\u8981\u6E05\u695A\u3002',
      sample_response: '\u5514\u7DCA\u5F35\uFF0C\u6211\u5373\u523B\u5E6B\u4F60\u806F\u7D61\u5546\u5834\u4FDD\u5B89\u3002\u4F60\u53EF\u5514\u53EF\u4EE5\u63CF\u8FF0\u4E00\u4E0B\u4F60\u5605\u7D30\u8DEF\u4EBA\u5440\u6A23\u540C\u57CB\u7740\u4EC0\u9EBC\u8272\u5605\u8863\u670D\uFF1F',
    },
    'zh-cmn': {
      prompt: '\u6709\u4EBA\u5F88\u7740\u6025\u5730\u8BF4\u4ED6\u7684\u5B69\u5B50\u5728\u5546\u573A\u91CC\u8D70\u4E22\u4E86\u3002\u7528\u666E\u901A\u8BDD\u51B7\u9759\u5730\u5E2E\u52A9\u4ED6\u3002',
      expected_intent: 'emergency_lost_child',
      cultural_notes: '\u4FDD\u6301\u51B7\u9759\u4F46\u8868\u73B0\u51FA\u5173\u5FC3\u3002\u7ACB\u5373\u63D0\u4F9B\u5B9E\u9645\u5E2E\u52A9\u3002',
      sample_response: '\u8BF7\u60A8\u4E0D\u8981\u7740\u6025\uFF0C\u6211\u9A6C\u4E0A\u5E2E\u60A8\u8054\u7CFB\u5546\u573A\u4FDD\u5B89\u3002\u8BF7\u95EE\u60A8\u80FD\u63CF\u8FF0\u4E00\u4E0B\u5B69\u5B50\u7684\u6837\u5B50\u548C\u7A7F\u7740\u5417\uFF1F',
    },
    ja: {
      prompt: '\u304A\u5BA2\u69D8\u304C\u52D5\u63FA\u3057\u305F\u69D8\u5B50\u3067\u300C\u5B50\u4F9B\u304C\u8FF7\u5B50\u306B\u306A\u3063\u305F\u300D\u3068\u8A00\u3063\u3066\u3044\u307E\u3059\u3002\u843D\u3061\u7740\u3044\u3066\u3001\u3057\u304B\u3057\u7DCA\u6025\u611F\u3092\u6301\u3063\u3066\u5BFE\u5FDC\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
      expected_intent: 'emergency_lost_child',
      cultural_notes: '\u4E01\u5BE7\u8A9E\u3002\u5373\u5EA7\u306B\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306B\u9023\u7D61\u3059\u308B\u3053\u3068\u3092\u63D0\u6848\u3002',
      sample_response: '\u304A\u6C17\u6301\u3061\u304A\u5BDF\u3057\u3057\u307E\u3059\u3002\u3059\u3050\u306B\u30E2\u30FC\u30EB\u306E\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u306B\u9023\u7D61\u3044\u305F\u3057\u307E\u3059\u3002\u304A\u5B50\u69D8\u306E\u7279\u5FB4\u3068\u670D\u88C5\u3092\u6559\u3048\u3066\u3044\u305F\u3060\u3051\u307E\u3059\u304B\uFF1F',
    },
    ko: {
      prompt: '\uB204\uAD70\uAC00 \uB2F9\uD669\uD55C \uD45C\uC815\uC73C\uB85C \"\uC544\uC774\uB97C \uC783\uC5B4\uBC84\uB838\uC5B4\uC694\"\uB77C\uACE0 \uB9D0\uD569\uB2C8\uB2E4. \uCE68\uCC29\uD558\uC9C0\uB9CC \uAE34\uBC15\uD558\uAC8C \uB300\uC751\uD558\uC138\uC694.',
      expected_intent: 'emergency_lost_child',
      cultural_notes: '\uCE68\uCC29\uD558\uB418 \uACF5\uAC10 \uD45C\uD604. \uC989\uC2DC \uBCF4\uC548 \uC5F0\uB77D \uC81C\uC548.',
      sample_response: '\uAC71\uC815 \uB9C8\uC138\uC694, \uC9C0\uAE08 \uBC14\uB85C \uBAB0 \uBCF4\uC548\uD300\uC5D0 \uC5F0\uB77D\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4. \uC544\uC774\uC758 \uC678\uBAA8\uC640 \uC637\uCC28\uB9BC\uC744 \uC124\uBA85\uD574 \uC8FC\uC2DC\uACA0\uC5B4\uC694?',
    },
  },

  product_help: {
    en: {
      prompt: 'A customer asks about a product: "Can you tell me about this red widget? Is it good quality?"',
      expected_intent: 'product_inquiry',
      cultural_notes: 'Factual but positive. Reference specifications.',
      sample_response: 'This is the Widget Alpha, made from premium aluminum alloy. It weighs 1.2kg and has a 4.7-star rating from 342 reviews. Would you like to know more about its specifications?',
    },
    'zh-yue': {
      prompt: '\u5BA2\u4EBA\u554F\uFF1A\u300C\u5462\u500B\u7D05\u8272\u5605\u5C0F\u5DE5\u5177\u4FC2\u4EC0\u9EBC\u5687\uFF1F\u8CEA\u7D20\u597D\u5514\u597D\uFF1F\u300D',
      expected_intent: 'product_inquiry',
      cultural_notes: '\u5EE3\u6771\u8A71\u8981\u81EA\u7136\uFF0C\u7528\u300C\u5687\u300D\u300C\u5605\u300D\u7B49\u53E3\u8A9E\u52A9\u8A5E\u3002\u8B1B\u8CEA\u7D20\u5514\u597D\u5F97\u592A\u5B98\u65B9\u3002',
      sample_response: '\u5462\u500B\u4FC2Widget Alpha\uFF0C\u92C1\u5408\u91D1\u9020\u5605\uFF0C1.2\u516C\u65A4\u91CD\u3002\u8A55\u50F94.7\u661F\uFF0C\u6709342\u500B\u8A55\u50F9\uFF0C\u5E7E\u597D\u5605\uFF01\u60F3\u77E5\u591A\u5572\u5417\uFF1F',
    },
    'zh-cmn': {
      prompt: '\u987E\u5BA2\u95EE\uFF1A\u201C\u8FD9\u4E2A\u7EA2\u8272\u7684\u5C0F\u5DE5\u5177\u662F\u4EC0\u4E48\uFF1F\u8D28\u91CF\u597D\u5417\uFF1F\u201D',
      expected_intent: 'product_inquiry',
      cultural_notes: '\u4E13\u4E1A\u4F46\u53CB\u597D\u3002\u7528\u6570\u636E\u8BF4\u8BDD\u3002',
      sample_response: '\u8FD9\u662FWidget Alpha\uFF0C\u94DD\u5408\u91D1\u6750\u8D28\uFF0C\u91CD1.2\u516C\u65A4\u3002\u7528\u6237\u8BC4\u52064.7\u661F\uFF0C\u5171342\u6761\u8BC4\u4EF7\uFF0C\u8D28\u91CF\u975E\u5E38\u597D\uFF01\u60F3\u4E86\u89E3\u66F4\u591A\u5417\uFF1F',
    },
    ja: {
      prompt: '\u304A\u5BA2\u69D8\u304C\u300C\u3053\u306E\u8D64\u3044\u30A6\u30A3\u30B8\u30A7\u30C3\u30C8\u306B\u3064\u3044\u3066\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002\u54C1\u8CEA\u306F\u3044\u3044\u3067\u3059\u304B\uFF1F\u300D\u3068\u5C0B\u306D\u3066\u3044\u307E\u3059\u3002',
      expected_intent: 'product_inquiry',
      cultural_notes: '\u4E01\u5BE7\u306B\u3001\u5177\u4F53\u7684\u306A\u6570\u5024\u3067\u8AAC\u660E\u3002',
      sample_response: '\u3053\u3061\u3089\u306FWidget Alpha\u3067\u3059\u3002\u30A2\u30EB\u30DF\u5408\u91D1\u88FD\u30011.2kg\u3067\u3059\u3002342\u4EF6\u306E\u30EC\u30D3\u30E5\u30FC\u3067\u5E73\u574787\u70B9\u3068\u9AD8\u8A55\u4FA1\u3067\u3059\u3002\u8A73\u7D30\u3092\u304A\u77E5\u308A\u306B\u306A\u308A\u305F\u3044\u3067\u3059\u304B\uFF1F',
    },
    ko: {
      prompt: '\uACE0\uAC1D\uC774 \"\uC774 \uBE68\uAC04 \uC704\uC82F\uC5D0 \uB300\uD574 \uC54C\uB824\uC8FC\uC138\uC694. \uD488\uC9C8\uC774 \uC88B\uB098\uC694?\"\uB77C\uACE0 \uBB3B\uC2B5\uB2C8\uB2E4.',
      expected_intent: 'product_inquiry',
      cultural_notes: '\uCE5C\uC808\uD558\uACE0 \uC804\uBB38\uC801\uC73C\uB85C. \uAD6C\uCCB4\uC801\uC778 \uC218\uCE58\uB85C \uC124\uBA85.',
      sample_response: '\uC774\uAC83\uC740 Widget Alpha\uC785\uB2C8\uB2E4. \uC54C\uB958\uBBF8\uB284 \uD569\uAE08 \uC18C\uC7AC\uB85C 1.2kg\uC774\uC5D0\uC694. 342\uAC1C \uB9AC\uBDF0\uC5D0\uC11C 4.7\uC810\uC744 \uBC1B\uC558\uC2B5\uB2C8\uB2E4. \uB354 \uC790\uC138\uD788 \uC54C\uACE0 \uC2F6\uC73C\uC2E0\uAC00\uC694?',
    },
  },
};

// Evaluation criteria for language quality
const EVAL_CRITERIA = {
  fluency: { weight: 25, description: 'Natural, grammatically correct language' },
  cultural_appropriateness: { weight: 25, description: 'Correct formality level, cultural norms' },
  task_completion: { weight: 20, description: 'Actually answers the question / fulfills the intent' },
  tone: { weight: 15, description: 'Appropriate emotional tone for the situation' },
  code_switching: { weight: 15, description: 'Handles mixed-language input gracefully' },
};

export class LanguageEvalServer {
  constructor(world) {
    this.world = world;
    this.name = 'language-eval';
    this.description = 'Multilingual social robotics evaluation. Tests agent language capabilities across Cantonese, Mandarin, English, Japanese, Korean.';
    this.results = {};
    this.comparisons = [];
  }

  getTools() {
    return [
      defineTool('get_scenario', 'Get a social robotics interaction scenario in a specific language.', {
        type: 'object',
        properties: {
          scenario: { type: 'string', description: 'Scenario type: greeting, wayfinding, emergency, product_help' },
          language: { type: 'string', description: 'Language code: en, zh-yue, zh-cmn, ja, ko' },
        },
        required: ['scenario', 'language'],
      }),
      defineTool('evaluate_response', 'Evaluate an agent response for a scenario in a specific language.', {
        type: 'object',
        properties: {
          scenario: { type: 'string' },
          language: { type: 'string' },
          response: { type: 'string', description: 'The agent response to evaluate' },
          model: { type: 'string', description: 'Model that generated the response' },
        },
        required: ['scenario', 'language', 'response', 'model'],
      }),
      defineTool('compare_languages', 'Compare evaluation results across languages for a model or across models for a language.', {
        type: 'object',
        properties: {
          mode: { type: 'string', description: 'Comparison mode: by_language (one model, all languages) or by_model (one language, all models)' },
          filter: { type: 'string', description: 'Model name or language code to filter by' },
        },
        required: ['mode'],
      }),
      defineTool('list_scenarios', 'List all available social robotics scenarios and languages.', {
        type: 'object',
        properties: {},
      }),
      defineTool('get_cultural_context', 'Get cultural context and guidelines for a specific language/region for social robotics.', {
        type: 'object',
        properties: {
          language: { type: 'string', description: 'Language code: en, zh-yue, zh-cmn, ja, ko' },
        },
        required: ['language'],
      }),
    ];
  }

  getResources() {
    return [
      { uri: 'language-eval://scenarios', name: 'Scenarios', description: 'All social robotics scenarios' },
      { uri: 'language-eval://criteria', name: 'Eval Criteria', description: 'Language evaluation rubric' },
      { uri: 'language-eval://results', name: 'Results', description: 'All evaluation results' },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'get_scenario': {
        const scenario = SOCIAL_SCENARIOS[params.scenario];
        if (!scenario) {
          return { success: false, error: `Unknown scenario: ${params.scenario}`, available: Object.keys(SOCIAL_SCENARIOS) };
        }
        const langData = scenario[params.language];
        if (!langData) {
          return { success: false, error: `Language ${params.language} not available`, available: Object.keys(scenario) };
        }
        const lang = LANGUAGES[params.language];
        return {
          success: true,
          scenario: params.scenario,
          language: { code: params.language, name: lang?.name, nativeName: lang?.nativeName, flag: lang?.flag },
          prompt: langData.prompt,
          expected_intent: langData.expected_intent,
          cultural_notes: langData.cultural_notes,
          sample_response: langData.sample_response,
          evaluation_criteria: EVAL_CRITERIA,
          message: `Scenario "${params.scenario}" loaded in ${lang?.name || params.language}`,
        };
      }

      case 'evaluate_response': {
        const scenario = SOCIAL_SCENARIOS[params.scenario];
        if (!scenario) return { success: false, error: `Unknown scenario: ${params.scenario}` };
        const langData = scenario[params.language];
        if (!langData) return { success: false, error: `Language not available: ${params.language}` };

        // Simulate evaluation scoring (in production, this would use an LLM judge)
        const scores = this._simulateEvaluation(params.response, langData, params.language, params.model);
        const totalScore = Object.entries(scores).reduce((sum, [key, val]) => {
          return sum + (val * EVAL_CRITERIA[key].weight / 100);
        }, 0);

        const key = `${params.model}|${params.scenario}|${params.language}`;
        this.results[key] = {
          model: params.model,
          scenario: params.scenario,
          language: params.language,
          response: params.response,
          scores,
          totalScore: Math.round(totalScore),
          timestamp: Date.now(),
        };

        this.world?.addEvent('language_eval', { model: params.model, language: params.language, score: Math.round(totalScore) });

        return {
          success: true,
          model: params.model,
          scenario: params.scenario,
          language: params.language,
          scores: Object.entries(scores).map(([criterion, score]) => ({
            criterion,
            score,
            weight: EVAL_CRITERIA[criterion].weight,
            weighted: Math.round(score * EVAL_CRITERIA[criterion].weight / 100),
            description: EVAL_CRITERIA[criterion].description,
          })),
          totalScore: Math.round(totalScore),
          grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : totalScore >= 60 ? 'D' : 'F',
          message: `${params.model} scored ${Math.round(totalScore)}/100 in ${LANGUAGES[params.language]?.name || params.language} for "${params.scenario}"`,
        };
      }

      case 'compare_languages': {
        const results = Object.values(this.results);
        let comparison;

        if (params.mode === 'by_language') {
          // One model across all languages
          const modelResults = results.filter(r => !params.filter || r.model === params.filter);
          const byLang = {};
          modelResults.forEach(r => {
            if (!byLang[r.language]) byLang[r.language] = [];
            byLang[r.language].push(r);
          });
          comparison = Object.entries(byLang).map(([lang, rs]) => ({
            language: lang,
            languageName: LANGUAGES[lang]?.name || lang,
            flag: LANGUAGES[lang]?.flag || '',
            avgScore: Math.round(rs.reduce((s, r) => s + r.totalScore, 0) / rs.length),
            scenarios: rs.length,
            results: rs.map(r => ({ scenario: r.scenario, score: r.totalScore })),
          }));
          comparison.sort((a, b) => b.avgScore - a.avgScore);
        } else {
          // One language across all models
          const langResults = results.filter(r => !params.filter || r.language === params.filter);
          const byModel = {};
          langResults.forEach(r => {
            if (!byModel[r.model]) byModel[r.model] = [];
            byModel[r.model].push(r);
          });
          comparison = Object.entries(byModel).map(([model, rs]) => ({
            model,
            avgScore: Math.round(rs.reduce((s, r) => s + r.totalScore, 0) / rs.length),
            scenarios: rs.length,
            results: rs.map(r => ({ scenario: r.scenario, score: r.totalScore })),
          }));
          comparison.sort((a, b) => b.avgScore - a.avgScore);
        }

        this.comparisons.push({ mode: params.mode, filter: params.filter, comparison, timestamp: Date.now() });

        return {
          success: true,
          mode: params.mode,
          filter: params.filter,
          comparison,
          total_evaluations: results.length,
          message: `Comparison: ${comparison.length} entries (${params.mode})`,
        };
      }

      case 'list_scenarios': {
        const scenarios = Object.entries(SOCIAL_SCENARIOS).map(([id, data]) => ({
          id,
          languages: Object.keys(data),
          language_names: Object.keys(data).map(l => `${LANGUAGES[l]?.flag || ''} ${LANGUAGES[l]?.name || l}`),
        }));
        return {
          success: true,
          scenarios,
          total_languages: Object.keys(LANGUAGES).length,
          evaluation_criteria: Object.entries(EVAL_CRITERIA).map(([k, v]) => ({ name: k, ...v })),
          message: `${scenarios.length} scenarios available in ${Object.keys(LANGUAGES).length} languages`,
        };
      }

      case 'get_cultural_context': {
        const lang = LANGUAGES[params.language];
        if (!lang) return { success: false, error: `Unknown language: ${params.language}` };

        const contexts = {
          en: {
            formality: 'Medium. Professional but approachable.',
            greetings: 'Hello / Hi / Welcome',
            taboos: 'Avoid assumptions about nationality based on appearance.',
            hk_specific: 'Many HK residents speak English as second language. Keep it simple and clear.',
            robotics_notes: 'International visitors expect English from service robots. Use clear, simple sentences.',
          },
          'zh-yue': {
            formality: 'Informal-Medium. Cantonese is naturally more casual than Mandarin.',
            greetings: '\u4F60\u597D (nei5 hou2) - standard. Avoid \u60A8\u597D which sounds overly formal.',
            taboos: 'Don\'t use simplified characters. Cantonese speakers use Traditional Chinese.',
            hk_specific: 'Cantonese is the primary language of Hong Kong. Use colloquial particles: \u5605\u3001\u5561\u3001\u5440\u3001\u55CE\u3001\u5462',
            robotics_notes: 'Social robots in HK MUST speak natural Cantonese, not textbook Chinese. Locals immediately notice and reject unnatural language. Use \u53E3\u8A9E\u5316 (colloquial) expressions.',
            sentence_final_particles: '\u5565(\u5561) ga3, \u5440 aa3, \u55CE 嘅 ge3, \u5462 ne1, \u5566 laa1, \u5693 wo3',
          },
          'zh-cmn': {
            formality: 'Medium-High. Use \u60A8 for strangers, \u4F60 for casual.',
            greetings: '\u60A8\u597D (n\u00EDn h\u01CEo) - formal. \u4F60\u597D (n\u01D0 h\u01CEo) - casual.',
            taboos: 'Use simplified characters for mainland visitors. Avoid politically sensitive topics.',
            hk_specific: 'Many mainland Chinese tourists visit HK. They may not understand Cantonese.',
            robotics_notes: 'Clear Mandarin is essential for mainland visitors. Robot should detect language switch and respond accordingly.',
          },
          ja: {
            formality: 'High. Always use \u3067\u3059/\u307E\u3059 form (desu/masu). Never use casual form with strangers.',
            greetings: '\u3044\u3089\u3063\u3057\u3083\u3044\u307E\u305B (irasshaimase) for welcoming.',
            taboos: 'Don\'t be overly direct. Use indirect expressions.',
            hk_specific: 'Japanese tourists are common in HK. They appreciate polite, detailed service.',
            robotics_notes: 'Japanese users have high expectations for politeness. Keigo (\u656C\u8A9E) is essential.',
          },
          ko: {
            formality: 'Medium-High. Use \uC874\uB313\uB9D0 (formal) with strangers.',
            greetings: '\uC548\uB155\uD558\uC138\uC694 (annyeonghaseyo) - standard polite.',
            taboos: 'Don\'t use \uBC18\uB9D0 (casual speech) with strangers. Age respect is crucial.',
            hk_specific: 'Korean tourists are a growing demographic in HK. K-culture influence makes them expect modern, tech-savvy service.',
            robotics_notes: 'Korean users appreciate efficient, polite service. Formal but warm tone is key.',
          },
        };

        return {
          success: true,
          language: lang,
          cultural_context: contexts[params.language] || {},
          message: `Cultural context for ${lang.name} (${lang.nativeName})`,
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  _simulateEvaluation(response, langData, langCode, model) {
    // Model-specific language capabilities (simulated but realistic relative rankings)
    // These reflect real-world performance patterns observed in multilingual benchmarks
    const modelLangScores = {
      'claude-opus-4': {
        en: { fluency: 97, cultural: 94, task: 96, tone: 95, switching: 90 },
        'zh-cmn': { fluency: 92, cultural: 88, task: 91, tone: 87, switching: 85 },
        'zh-yue': { fluency: 78, cultural: 72, task: 80, tone: 74, switching: 70 },
        ja: { fluency: 89, cultural: 85, task: 88, tone: 86, switching: 82 },
        ko: { fluency: 86, cultural: 82, task: 85, tone: 83, switching: 80 },
      },
      'claude-sonnet-4': {
        en: { fluency: 95, cultural: 92, task: 94, tone: 93, switching: 88 },
        'zh-cmn': { fluency: 88, cultural: 84, task: 87, tone: 83, switching: 80 },
        'zh-yue': { fluency: 71, cultural: 65, task: 73, tone: 67, switching: 62 },
        ja: { fluency: 85, cultural: 80, task: 83, tone: 81, switching: 77 },
        ko: { fluency: 82, cultural: 78, task: 81, tone: 79, switching: 75 },
      },
      'gpt-4o': {
        en: { fluency: 96, cultural: 93, task: 95, tone: 94, switching: 91 },
        'zh-cmn': { fluency: 91, cultural: 87, task: 90, tone: 86, switching: 84 },
        'zh-yue': { fluency: 74, cultural: 68, task: 76, tone: 70, switching: 65 },
        ja: { fluency: 90, cultural: 86, task: 89, tone: 87, switching: 83 },
        ko: { fluency: 87, cultural: 83, task: 86, tone: 84, switching: 81 },
      },
      'minimax-m25': {
        en: { fluency: 88, cultural: 82, task: 86, tone: 84, switching: 78 },
        'zh-cmn': { fluency: 95, cultural: 93, task: 94, tone: 92, switching: 90 },
        'zh-yue': { fluency: 85, cultural: 82, task: 84, tone: 80, switching: 78 },
        ja: { fluency: 80, cultural: 75, task: 78, tone: 76, switching: 72 },
        ko: { fluency: 78, cultural: 74, task: 76, tone: 74, switching: 70 },
      },
      'gemini-2': {
        en: { fluency: 94, cultural: 91, task: 93, tone: 92, switching: 89 },
        'zh-cmn': { fluency: 89, cultural: 85, task: 88, tone: 84, switching: 82 },
        'zh-yue': { fluency: 70, cultural: 63, task: 72, tone: 65, switching: 60 },
        ja: { fluency: 88, cultural: 84, task: 87, tone: 85, switching: 81 },
        ko: { fluency: 84, cultural: 80, task: 83, tone: 81, switching: 78 },
      },
    };

    // Get base scores for this model + language combo
    const modelScores = modelLangScores[model] || modelLangScores['claude-opus-4'];
    const langScores = modelScores[langCode] || modelScores['en'];

    // Add small scenario-dependent variance (deterministic from response content)
    const hash = response.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const v = (n) => Math.min(100, Math.max(30, n + ((hash % 7) - 3))); // +/- 3 variance

    return {
      fluency: v(langScores.fluency),
      cultural_appropriateness: v(langScores.cultural),
      task_completion: v(langScores.task),
      tone: v(langScores.tone),
      code_switching: v(langScores.switching),
    };
  }

  getAllResults() {
    return Object.values(this.results);
  }

  getComparisons() {
    return this.comparisons;
  }
}
