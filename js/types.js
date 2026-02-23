// MCP Arena - Shared Types & Constants

export const GRID = {
  WIDTH: 800,
  HEIGHT: 500,
  CELL_SIZE: 50,
  COLS: 16,
  ROWS: 10,
};

export const ROBOT_CONFIG = {
  ARM_LENGTH: 120,
  GRIPPER_SIZE: 20,
  MOVE_SPEED: 4, // pixels per frame
  ROTATION_SPEED: 3, // degrees per frame
  BASE_RADIUS: 30,
  JOINT_RADIUS: 8,
};

export const COLORS = {
  BG: '#0a0a1a',
  GRID_LINE: '#1a1a3a',
  ROBOT_BASE: '#4f46e5',
  ROBOT_ARM: '#6366f1',
  ROBOT_GRIPPER: '#818cf8',
  ROBOT_ACTIVE: '#22d3ee',
  OBJECT_RED: '#ef4444',
  OBJECT_BLUE: '#3b82f6',
  OBJECT_GREEN: '#22c55e',
  OBJECT_YELLOW: '#eab308',
  OBJECT_PURPLE: '#a855f7',
  TEXT: '#e2e8f0',
  TEXT_DIM: '#64748b',
  ACCENT: '#6366f1',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  PANEL_BG: '#111827',
  PANEL_BORDER: '#1e293b',
  SCAN_RING: 'rgba(34, 211, 238, 0.3)',
};

export const TOOL_ICONS = {
  move: '\u{1F3AF}',
  grab: '\u{1F91D}',
  scan: '\u{1F4E1}',
  rotate: '\u{1F504}',
  status: '\u{2139}',
  release: '\u{1F91A}',
  fetch_page: '\u{1F310}',
  extract_data: '\u{1F50D}',
  search_catalog: '\u{1F6D2}',
  list_urls: '\u{1F517}',
  submit_result: '\u{2705}',
  check_completion: '\u{1F4CB}',
  get_task: '\u{1F4DD}',
  report_metric: '\u{1F4CA}',
  get_scenario: '\u{1F3AD}',
  evaluate_response: '\u{1F9EA}',
  compare_languages: '\u{1F30F}',
  list_scenarios: '\u{1F4DA}',
  get_cultural_context: '\u{1F3EF}',
};

export const MODEL_CONFIGS = {
  'claude-opus-4': { name: 'Claude Opus 4', color: '#d97706', speed: 1.0 },
  'claude-sonnet-4': { name: 'Claude Sonnet 4', color: '#6366f1', speed: 1.5 },
  'gpt-4o': { name: 'GPT-4o', color: '#22c55e', speed: 1.2 },
  'minimax-m25': { name: 'MiniMax M2.5', color: '#ec4899', speed: 2.0 },
  'gemini-2': { name: 'Gemini 2.0', color: '#3b82f6', speed: 1.3 },
};

// Language configurations for multilingual evaluation
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '\u{1F1EC}\u{1F1E7}',
    direction: 'ltr',
    region: 'Global',
  },
  'zh-yue': {
    code: 'zh-yue',
    name: 'Cantonese',
    nativeName: '\u5EE3\u6771\u8A71',
    flag: '\u{1F1ED}\u{1F1F0}',
    direction: 'ltr',
    region: 'Hong Kong / Guangdong',
  },
  'zh-cmn': {
    code: 'zh-cmn',
    name: 'Mandarin',
    nativeName: '\u666E\u901A\u8A71',
    flag: '\u{1F1E8}\u{1F1F3}',
    direction: 'ltr',
    region: 'Mainland China / Taiwan',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '\u65E5\u672C\u8A9E',
    flag: '\u{1F1EF}\u{1F1F5}',
    direction: 'ltr',
    region: 'Japan',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '\uD55C\uAD6D\uC5B4',
    flag: '\u{1F1F0}\u{1F1F7}',
    direction: 'ltr',
    region: 'Korea',
  },
};

// MCP Tool Call shape (follows the MCP spec)
export function createToolCall(serverName, toolName, params) {
  return {
    id: crypto.randomUUID(),
    server: serverName,
    tool: toolName,
    parameters: params,
    timestamp: Date.now(),
    status: 'pending', // pending | success | error
    result: null,
    duration: 0,
  };
}

// MCP Tool Definition shape
export function defineTool(name, description, inputSchema) {
  return { name, description, inputSchema };
}
