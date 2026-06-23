#!/usr/bin/env node
/**
 * 取生效的快照模式（v1.0 - 会话级覆盖）
 * 优先级: session-snap-mode.json (会话内) > snapshot-config.json (全局) > 默认 milestone
 *
 * 用法:
 *   node get-snap-mode.js                 # 输出 mode 字符串
 *   node get-snap-mode.js --json          # 输出 JSON {mode, source, setAt, setBy}
 *   node get-snap-mode.js --include-config # 输出 mode + minIntervalMinutes
 *
 * 退出码:
 *   0 = 始终
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SESSION_FILE = path.join(ROOT, '.claude', 'session-snap-mode.json');
const CONFIG_FILE = path.join(ROOT, '.claude', 'snapshot-config.json');
const VALID_MODES = ['off', 'manual', 'milestone', 'auto'];

function readJsonSafe(file) {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function resolve() {
  // 1. 会话级覆盖
  const session = readJsonSafe(SESSION_FILE);
  if (session && VALID_MODES.includes(session.mode)) {
    return {
      mode: session.mode,
      source: 'session-snap-mode.json',
      setAt: session.setAt || null,
      setBy: session.setBy || '/snap-mode',
      minIntervalMinutes: null,
    };
  }

  // 2. 全局配置
  const config = readJsonSafe(CONFIG_FILE);
  if (config && VALID_MODES.includes(config.mode)) {
    return {
      mode: config.mode,
      source: 'snapshot-config.json',
      setAt: null,
      setBy: null,
      minIntervalMinutes: config.minIntervalMinutes || 30,
    };
  }

  // 3. 默认
  return {
    mode: 'milestone',
    source: 'default',
    setAt: null,
    setBy: null,
    minIntervalMinutes: 30,
  };
}

const result = resolve();
const args = process.argv.slice(2);

if (args.includes('--json')) {
  console.log(JSON.stringify(result));
} else if (args.includes('--include-config')) {
  console.log(JSON.stringify({ mode: result.mode, minIntervalMinutes: result.minIntervalMinutes }));
} else {
  console.log(result.mode);
}
