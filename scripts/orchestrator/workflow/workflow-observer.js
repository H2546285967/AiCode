#!/usr/bin/env node
/**
 * workflow-observer.js — 个人 workflow 事件采集器（v2.0 P0-5）
 *
 * 作用：
 *   - 采集用户在工作空间中的行为事件
 *   - 写入 .claude/skills/left-brain/memory/workflow-events.jsonl
 *   - 为 pattern-miner 提供原始数据
 *
 * 事件类型：
 *   - file_modified    文件修改（从 git status / diff 提取）
 *   - command_run      命令执行（如 npm test）
 *   - test_run         测试运行
 *   - commit           git commit
 *   - plan_created     创建 [plan] 块
 *   - plan_approved    /ok 批准 plan
 *   - session_start    新会话开始
 *   - session_end      会话结束
 *
 * 用法：
 *   const Observer = require('./workflow-observer');
 *   Observer.record('command_run', { command: 'npm test', cwd: '.' });
 *
 *   CLI:
 *   node workflow-observer.js record command_run '{"command":"npm test"}'
 *   node workflow-observer.js recent --hours 24
 *   node workflow-observer.js stats
 *
 * 设计原则：
 *   - 零依赖（fs + path + child_process）
 *   - 写入失败不影响主流程
 *   - 自动按会话聚合，避免事件过细
 *   - 30 天滚动清理
 *
 * @since v2.0.2 (2026-06-25)
 * @source 03_版本迭代计划.md §五 v2.0 P0-5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVENTS_FILE, MEMORY_DIR, ensureDir, readFileSafe } = require('./utils');

// 数据保留 30 天
const RETENTION_DAYS = 30;

// 事件类型白名单（防止乱写）
const VALID_TYPES = new Set([
  'file_modified',
  'command_run',
  'test_run',
  'commit',
  'plan_created',
  'plan_approved',
  'session_start',
  'session_end',
]);

// ── 工具函数 ─────────────────────────────────────────

function execSafe(cmd, cwd) {
  try {
    return execSync(cmd, {
      cwd: cwd || WORKSPACE_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim();
  } catch {
    return null;
  }
}

function getSessionId() {
  // 优先从环境变量取（hook 注入），否则按小时粗分 session
  const envSession = process.env.CLAUDE_SESSION_ID;
  if (envSession) return envSession;
  return `session_${new Date().toISOString().slice(0, 13).replace(/[-T]/g, '')}`;
}

/**
 * 从文件路径提取模块/扩展名等元信息
 */
function classifyFiles(files) {
  const exts = new Set();
  const modules = new Set();
  const names = new Set();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext) exts.add(ext.slice(1));
    names.add(path.basename(file));

    // 模块推断：scripts/xxx/ → xxx
    const parts = file.split(/[/\\]/);
    if (parts.length >= 2 && parts[0] === 'scripts') {
      modules.add(parts[1]);
    } else if (parts.length >= 2 && parts[0] === '.claude') {
      modules.add('claude-config');
    } else if (parts[0] === 'data') {
      modules.add('data');
    } else if (/\.(md|json)$/.test(file)) {
      modules.add('docs');
    }
  }

  return {
    exts: Array.from(exts),
    modules: Array.from(modules),
    names: Array.from(names),
    count: files.length,
  };
}

// ── 核心 API ─────────────────────────────────────────

const Observer = {
  /**
   * 记录一个事件
   * @param {string} type 事件类型
   * @param {object} payload 事件负载
   * @param {object} [meta] 额外元信息
   * @returns {object|null} 写入的事件对象
   */
  record(type, payload = {}, meta = {}) {
    if (!VALID_TYPES.has(type)) {
      console.error(`[workflow-observer] 未知事件类型: ${type}`);
      return null;
    }

    const event = {
      ts: new Date().toISOString(),
      type,
      session: meta.session || getSessionId(),
      payload,
    };

    // 如果 payload 带 files，自动分类
    if (Array.isArray(payload.files) && payload.files.length > 0) {
      const classified = classifyFiles(payload.files);
      event.payload = {
        ...payload,
        ...classified,
      };
    }

    try {
      ensureDir(MEMORY_DIR);
      fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n');
    } catch (e) {
      process.stderr.write(`[workflow-observer] write failed: ${e.message}\n`);
      return null;
    }

    return event;
  },

  /**
   * 读取最近 N 小时的事件
   * @param {number} [hours=24]
   * @returns {object[]}
   */
  getRecentEvents(hours = 24) {
    if (!fs.existsSync(EVENTS_FILE)) return [];

    const since = Date.now() - hours * 60 * 60 * 1000;
    const events = [];

    const content = readFileSafe(EVENTS_FILE);
    if (!content) return [];

    const lines = content.split('\n');
    for (const line of lines) {
      if (!line) continue;
      try {
        const ev = JSON.parse(line);
        const ts = new Date(ev.ts).getTime();
        if (ts >= since) {
          events.push(ev);
        }
      } catch { /* skip malformed */ }
    }

    return events;
  },

  /**
   * 读取全部事件（带可选过滤）
   * @param {object} [filters] {type, sinceHours}
   * @returns {object[]}
   */
  getAllEvents(filters = {}) {
    if (!fs.existsSync(EVENTS_FILE)) return [];

    const since = filters.sinceHours
      ? Date.now() - filters.sinceHours * 60 * 60 * 1000
      : 0;

    const events = [];
    const content = readFileSafe(EVENTS_FILE);
    if (!content) return [];

    const lines = content.split('\n');
    for (const line of lines) {
      if (!line) continue;
      try {
        const ev = JSON.parse(line);
        const ts = new Date(ev.ts).getTime();
        if (ts < since) continue;
        if (filters.type && ev.type !== filters.type) continue;
        events.push(ev);
      } catch { /* skip malformed */ }
    }

    return events;
  },

  /**
   * 从 git status --porcelain 提取当前文件改动并记录
   * @returns {object|null}
   */
  recordFromGitStatus() {
    const output = execSafe('git status --porcelain');
    if (!output) return null;

    const files = output
      .split('\n')
      .filter(Boolean)
      .map(line => line.slice(3).trim())
      .filter(Boolean);

    if (files.length === 0) return null;

    return Observer.record('file_modified', { files });
  },

  /**
   * 从 PostToolUse hook 数据自动记录事件
   * @param {object} hookData { tool_use_name, tool_input, tool_output }
   * @returns {object|null}
   */
  recordFromPostToolUse(hookData) {
    if (!hookData || !hookData.tool_use_name) return null;

    const { tool_use_name, tool_input } = hookData;

    if (tool_use_name === 'Edit' || tool_use_name === 'Write') {
      // PostToolUse hook 中直接取工具输入的文件路径，比 git status 更准更快
      const file = tool_input && (tool_input.file_path || tool_input.path);
      if (file) {
        return this.record('file_modified', { files: [file], source: 'PostToolUse' });
      }
      // 无明确路径时 fallback 到 git status
      return this.recordFromGitStatus();
    }

    if (tool_use_name === 'Bash') {
      const command = (tool_input && tool_input.command) || '';
      if (!command) return null;

      if (/\bgit\s+commit\b/.test(command)) {
        const events = this.recordFromGitLog(1);
        if (events && events.length > 0) return events[0];
        return this.record('commit', { command, source: 'PostToolUse' });
      }
      if (/\b(npm\s+test|jest|mocha|pytest|vitest)\b/.test(command)) {
        return this.record('test_run', { command, source: 'PostToolUse' });
      }
      return this.record('command_run', { command, source: 'PostToolUse' });
    }

    return null;
  },

  /**
   * 从 git log 最近 commit 提取并记录
   * @param {number} [limit=1]
   */
  recordFromGitLog(limit = 1) {
    const output = execSafe(`git log --pretty=format:"%H|%s|%ad" --date=iso -${limit}`);
    if (!output) return [];

    const events = [];
    for (const line of output.split('\n').filter(Boolean)) {
      const [hash, subject, dateStr] = line.split('|');
      if (!hash) continue;
      events.push(Observer.record('commit', {
        hash: hash.slice(0, 8),
        subject,
        date: dateStr,
      }, { ts: dateStr }));
    }
    return events;
  },

  /**
   * 统计事件数量
   * @param {number} [hours=24]
   * @returns {object}
   */
  stats(hours = 24) {
    const events = Observer.getRecentEvents(hours);
    const byType = {};
    for (const ev of events) {
      byType[ev.type] = (byType[ev.type] || 0) + 1;
    }
    return {
      total: events.length,
      byType,
      hours,
      file: EVENTS_FILE,
    };
  },

  /**
   * 清理过期事件（滚动保留）
   * @param {number} [retentionDays=30]
   * @returns {number} 删除行数
   */
  cleanup(retentionDays = RETENTION_DAYS) {
    if (!fs.existsSync(EVENTS_FILE)) return 0;

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const content = readFileSafe(EVENTS_FILE);
    if (!content) return 0;

    const lines = content.split('\n').filter(Boolean);
    const kept = [];
    let removed = 0;

    for (const line of lines) {
      try {
        const ev = JSON.parse(line);
        const ts = new Date(ev.ts).getTime();
        if (ts >= cutoff) {
          kept.push(line);
        } else {
          removed++;
        }
      } catch {
        kept.push(line);
      }
    }

    try {
      fs.writeFileSync(EVENTS_FILE, kept.join('\n') + (kept.length > 0 ? '\n' : ''));
    } catch (e) {
      process.stderr.write(`[workflow-observer] cleanup failed: ${e.message}\n`);
      return 0;
    }

    return removed;
  },

  /** 文件路径（供测试） */
  get EVENTS_FILE() { return EVENTS_FILE; },
  get MEMORY_DIR() { return MEMORY_DIR; },
  get VALID_TYPES() { return Array.from(VALID_TYPES); },
};

// ── CLI 入口 ─────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2] || 'help';

  try {
    switch (cmd) {
      case 'record-posttool': {
        let data = '';
        const finish = () => {
          try {
            const hookData = JSON.parse(data);
            const ev = Observer.recordFromPostToolUse(hookData);
            if (ev) {
              console.log('✅ 已记录:', JSON.stringify(ev));
            }
          } catch {
            // 静默忽略，避免阻塞主流程
          }
          process.exit(0);
        };

        // 优先从文件参数读取（posttool-hook.sh 用临时文件传 JSON，避免 Windows bash pipe 问题）
        const fileArg = process.argv[3];
        if (fileArg) {
          try {
            data = fs.readFileSync(fileArg, 'utf8');
          } catch {
            data = '';
          }
          finish();
          return;
        }

        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => { data += chunk; });
        process.stdin.on('end', finish);
        process.stdin.resume();
        // 异步等待 stdin，不在这里 break
        return;
      }
      case 'record': {
        const type = process.argv[3];
        const payloadStr = process.argv[4] || '{}';
        const metaStr = process.argv[5] || '{}';
        let payload = {};
        let meta = {};
        try {
          payload = JSON.parse(payloadStr);
          meta = JSON.parse(metaStr);
        } catch {
          console.error('❌ payload / meta 必须是合法 JSON');
          process.exit(1);
        }
        const ev = Observer.record(type, payload, meta);
        if (ev) {
          console.log('✅ 已记录:', JSON.stringify(ev));
        } else {
          console.error('❌ 记录失败');
          process.exit(1);
        }
        break;
      }
      case 'recent': {
        const hours = parseFloat(process.argv[3]) || 24;
        const events = Observer.getRecentEvents(hours);
        console.log(`📋 最近 ${hours} 小时事件: ${events.length} 条`);
        for (const ev of events.slice(-20)) {
          console.log(`  [${ev.ts.slice(0, 19)}] ${ev.type} ${JSON.stringify(ev.payload).slice(0, 80)}`);
        }
        break;
      }
      case 'status':
      case 'stats': {
        const hours = parseFloat(process.argv[3]) || 24;
        const s = Observer.stats(hours);
        console.log(`📊 Workflow 事件统计（最近 ${s.hours} 小时）`);
        console.log(`  总数: ${s.total}`);
        for (const [t, c] of Object.entries(s.byType).sort((a, b) => b[1] - a[1])) {
          console.log(`  - ${t}: ${c}`);
        }
        break;
      }
      case 'cleanup': {
        const days = parseFloat(process.argv[3]) || RETENTION_DAYS;
        const removed = Observer.cleanup(days);
        console.log(`🧹 清理完成，删除 ${removed} 条过期事件`);
        break;
      }
      case 'help':
      default:
        console.log(`
workflow-observer.js — 个人 workflow 事件采集器

用法:
  node workflow-observer.js record <type> '<payload_json>' ['<meta_json>']
  node workflow-observer.js record-posttool [file]   # 从文件或 stdin 读 PostToolUse JSON
  node workflow-observer.js recent [hours=24]
  node workflow-observer.js stats [hours=24]
  node workflow-observer.js cleanup [days=30]

事件类型: ${Array.from(VALID_TYPES).join(', ')}

示例:
  node workflow-observer.js record command_run '{"command":"npm test"}'
  echo '{"tool_use_name":"Edit","tool_input":{"file_path":"x.js"}}' | node workflow-observer.js record-posttool
`);
    }
  } catch (e) {
    console.error('❌ 异常:', e.message);
  }
  process.exit(0);
}

module.exports = Observer;
