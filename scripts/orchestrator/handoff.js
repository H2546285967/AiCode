#!/usr/bin/env node
/**
 * handoff.js — 会话切换助手（v3.0.4 M21）
 *
 * 作用：
 *   - 自动保存当前会话进度（强制写快照）
 *   - 生成"接续 prompt"（拼装 4 段：摘要 / 待办 / 下阶段 / 约束）
 *   - 写 autonomous-state.json.awaiting_handoff 标记待接续
 *   - 输出 CLI 提示"下个会话新窗口输入：<prompt> 即可接续"
 *
 * 设计原则：
 *   - **不破坏**已有 /autonomous / /snap-save 流程
 *   - **复用** session-summary.sh save + autonomous-state.json schema
 *   - **dry-run 默认** 让你先看接续 prompt 再决定
 *   - **零依赖** 纯 Node.js + 复用 session-summary.sh
 *
 * 用法：
 *   node handoff.js "M20: decision-assistant.js"   # 强制写快照 + 生成 prompt
 *   node handoff.js "M20" --dry-run                # 只打印 prompt 不写
 *
 * @since v3.0.4 (2026-06-26) M21
 * @source 04_自我演进路线.md §0.7 演进计划的功能怎么来的
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

// ── 配置 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..');
const SKILL_DIR = path.join(WORKSPACE_ROOT, '.claude', 'skills', 'left-brain');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');
const AUTONOMOUS_STATE_FILE = path.join(MEMORY_DIR, 'autonomous-state.json');
const SNAPSHOT_FILE = path.join(MEMORY_DIR, 'sessions', 'latest_state.json');
const SESSION_SUMMARY_SCRIPT = path.join(SKILL_DIR, 'scripts', 'session-summary.sh');

// ── 工具函数 ─────────────────────────────────────────

function readJSON(file, def = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function now() {
  return new Date().toISOString();
}

function loadAutonomousState() {
  return readJSON(AUTONOMOUS_STATE_FILE, { enabled: false });
}

function saveAutonomousState(state) {
  writeJSON(AUTONOMOUS_STATE_FILE, state);
}

function loadSnapshot() {
  return readJSON(SNAPSHOT_FILE, null);
}

/**
 * 自动存快照（强制，绕过模式）
 * 复用 session-summary.sh save + 写 next_action 到 latest_state.json
 */
function saveSnapshot(title, nextTitle, tags = ['handoff']) {
  const tagStr = tags.join(' ');
  const note = `[已 handoff] ${title}\n\nnext: ${nextTitle}`;

  try {
    const out = execFileSync('bash', [SESSION_SUMMARY_SCRIPT, 'save', note, tagStr, '--force'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: WORKSPACE_ROOT,
    });

    // 同步写 next_action 到 latest_state.json（session-summary.sh 不支持 -m 参数）
    if (fs.existsSync(SNAPSHOT_FILE)) {
      try {
        const snap = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
        snap.next_action = nextTitle;
        snap.handoff_at = now();
        snap.handoff_title = title;
        writeJSON(SNAPSHOT_FILE, snap);
      } catch { /* 容错 */ }
    }

    return { saved: true, output: out };
  } catch (e) {
    return { saved: false, error: e.message };
  }
}

/**
 * 生成"接续 prompt"（拼装 4 段）
 *
 * 4 段：
 *   1. 会话摘要（来自 latest_summary.md）
 *   2. 当前待办 / 决策快照（来自 latest_state.json）
 *   3. 下一阶段（用户传入的 title）
 *   4. 约束 / 注意事项（自主模式状态、next 队列、关键文件）
 */
function buildHandoffPrompt(title, nextTitle, snapshot, autonomousState) {
  const lines = [];
  const divider = '━'.repeat(60);

  lines.push(divider);
  lines.push('🚀 会话交接 — 继续工作模式');
  lines.push(divider);
  lines.push('');
  lines.push(`你正在接续上一会话的工作（${title}）。`);
  lines.push('');
  lines.push('## 📋 上一会话快照');
  lines.push('');

  // 1. 会话摘要
  if (snapshot?.summary) {
    lines.push('### 会话摘要');
    lines.push('```');
    lines.push(snapshot.summary.slice(0, 500) + (snapshot.summary.length > 500 ? '...' : ''));
    lines.push('```');
    lines.push('');
  }

  // 2. 待办 / 决策
  if (snapshot?.pending_todos?.length > 0) {
    lines.push('### 待办列表');
    for (const todo of snapshot.pending_todos.slice(0, 5)) {
      lines.push(`- ${todo}`);
    }
    lines.push('');
  }

  // 3. 下一阶段
  lines.push('## 🎯 下一阶段目标');
  lines.push('');
  lines.push(`**${nextTitle}**`);
  lines.push('');
  lines.push('> 执行步骤：');
  lines.push('> 1. 读取 `.claude/skills/left-brain/memory/sessions/latest_state.json` 完整快照');
  lines.push('> 2. 读取 `04_自我演进路线.md` §0.4 找到对应增量段定义');
  lines.push('> 3. 按增量段验收标准实施');
  lines.push('> 4. 写测试 + 跑全量回归');
  lines.push('> 5. 同步 4 文档 + commit + 释放锁 + 写快照');
  lines.push('');

  // 4. 约束 / 当前状态
  lines.push('## ⚠️ 当前状态与约束');
  lines.push('');
  lines.push(`- **自主模式**：${autonomousState.enabled ? `ON（${autonomousState.mode || 'always'}）` : 'OFF'}`);
  lines.push(`- **演进锁**：${snapshot?.stage?.current ? `占用（${snapshot.stage.current}）` : '🟢 空闲'}`);
  lines.push(`- **当前快照时间**：${snapshot?.snapshot_at || snapshot?.updated_at || '(无)'}`);
  lines.push('');
  lines.push('**关键约束**：');
  lines.push('- 不修改根目录外文件');
  lines.push('- 不 push / 不删分支');
  lines.push('- 不偷改 evolution-plan.json（用 evolution-lock.js queue）');
  lines.push('- 完成后调 autonomous-runner.js complete-stage 或 evolution-lock.js complete');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('**你的第一句话应该说什么？**');
  lines.push('');
  lines.push(`> "继续 ${nextTitle}，先读 latest_state.json 和 04.md §0.4。"`);

  return lines.join('\n');
}

/**
 * 更新 autonomous-state.json 标 awaiting_handoff
 */
function markAwaitingHandoff(nextTitle, reason) {
  const state = loadAutonomousState();
  state.awaiting_handoff = true;
  state.handoff_at = now();
  state.handoff_next = nextTitle;
  state.handoff_reason = reason || null;
  state.next_action = nextTitle;
  saveAutonomousState(state);
  return state;
}

/**
 * 清除 awaiting_handoff 标记（下次会话开窗时）
 */
function clearAwaitingHandoff() {
  const state = loadAutonomousState();
  delete state.awaiting_handoff;
  delete state.handoff_at;
  delete state.handoff_next;
  delete state.handoff_reason;
  saveAutonomousState(state);
  return state;
}

/**
 * 把 nextTitle 实际入队到 evolution-plan.json
 * @param {string} id
 * @param {string} title
 * @param {string} note
 * @returns {boolean} 是否真入队
 */
function enqueueNext(id, title, note) {
  try {
    const planPath = AUTONOMOUS_STATE_FILE.replace('autonomous-state.json', 'evolution-plan.json');
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    // 已存在不重复入队
    if (plan.next.find(x => x.id === id) || (plan.current && plan.current.id === id)) {
      return false;
    }
    const result = execFileSync('node', [
      path.join(WORKSPACE_ROOT, 'scripts', 'orchestrator', 'evolution-lock.js'),
      'queue', id, title, note || `handoff: ${title}`,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], cwd: WORKSPACE_ROOT });
    return result.includes('已加入 next 队列') || !result.includes('已存在');
  } catch (e) {
    return false;
  }
}

/**
 * 启动新 claude 子进程，自动接续下一阶段
 * 参考 autonomous-runner.js 的 spawn 模式
 */
function spawnClaudeContinuation(prompt, nextTitle) {
  return new Promise((resolve) => {
    // 优先用 CLAUDE_BIN 环境变量
    let claudeBin = process.env.CLAUDE_BIN || 'claude';
    if (process.platform === 'win32' && claudeBin === 'claude') {
      const roaming = process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'claude.cmd');
      if (roaming && fs.existsSync(roaming)) claudeBin = roaming;
    }

    log('INFO', `启动新子会话自动接续: ${nextTitle}`);
    log('INFO', `  bin: ${claudeBin}`);

    const child = spawn(claudeBin, ['-p', prompt], {
      cwd: WORKSPACE_ROOT,
      stdio: 'inherit',
      shell: true,
    });

    child.on('exit', (code, signal) => {
      log('INFO', `子会话结束: code=${code}, signal=${signal}`);
      resolve({ code, signal });
    });

    child.on('error', (err) => {
      log('ERROR', `启动子会话失败: ${err.message}`);
      if (err.code === 'ENOENT') {
        log('ERROR', `  找不到 '${claudeBin}'`);
        log('ERROR', `  修复: 1) npm i -g @anthropic-ai/claude-code`);
        log('ERROR', `       2) 或设置 CLAUDE_BIN 环境变量`);
      }
      resolve({ code: -1, signal: null, error: err.message });
    });
  });
}

function log(level, message) {
  const ts = new Date().toLocaleString('zh-CN');
  console.log(`[${ts}] [${level}] ${message}`);
}

/**
 * 主入口
 */
function handoff(title, opts = {}) {
  const { nextTitle, dryRun = false, auto = false, tags = ['handoff'] } = opts;

  if (!title) {
    throw new Error('必须提供 title（例："M20: decision-assistant.js"）');
  }

  const snapshot = loadSnapshot();
  const autonomousState = loadAutonomousState();

  // 1. 生成接续 prompt
  const prompt = buildHandoffPrompt(title, nextTitle || title, snapshot, autonomousState);

  // 2. dry-run 模式只打印
  if (dryRun) {
    return { dryRun: true, prompt };
  }

  // 3. 写快照
  const saveResult = saveSnapshot(title, nextTitle || title, tags);
  if (!saveResult.saved) {
    throw new Error(`快照保存失败: ${saveResult.error}`);
  }

  // 4. 更新 autonomous-state.json
  markAwaitingHandoff(nextTitle || title, title);

  // 5. v3.0.4 M22: --auto 模式 — 实际入队 next + spawn 新子进程
  const enqueued = enqueueNext(
    nextTitle || 'M-next',
    nextTitle || title,
    `handoff from "${title}"`
  );

  const result = {
    saved: true,
    snapshotPath: SNAPSHOT_FILE,
    autonomousStatePath: AUTONOMOUS_STATE_FILE,
    prompt,
    enqueued,
    auto,
  };

  if (auto && !dryRun) {
    result.spawnedClaude = true; // 同步标记
  }

  return result;
}

// ── CLI ───────────────────────────────────────────────

function showHelp() {
  console.log(`
handoff.js — 会话切换助手（v3.0.4 M21 + v3.0.4 M22 --auto）

用法:
  node handoff.js "标题" [next-title]               # 强制存快照 + 生成 prompt
  node handoff.js "标题" --dry-run                  # 只打印 prompt 不写
  node handoff.js "标题" "next" --auto              # 全自动：存快照 + 入队 + spawn 新子进程

参数:
  第一个 (必填)   当前会话标题（写快照用）
  第二个 (可选)   下一阶段标题（默认 = 第一个）
  --auto / -a     全自动模式（入队 next + spawn 新子进程接续）
  --dry-run       只打印接续 prompt，不写快照
  --tags "tag1 tag2"  自定义快照标签

输出:
  1. 自动存快照到 .claude/skills/left-brain/memory/sessions/latest_state.json
  2. 标记 autonomous-state.json.awaiting_handoff = true
  3. 实际入队 evolution-plan.json next（如果 ID 不存在）
  4. 输出"接续 prompt"
  5. --auto 时直接 spawn claude -p 新子进程（不需手动 /clear）
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const auto = args.includes('--auto') || args.includes('-a');
  const tagsIdx = args.indexOf('--tags');
  const tags = tagsIdx !== -1 ? args[tagsIdx + 1].split(/\s+/) : ['handoff'];

  // 解析位置参数
  const positional = args.filter(a => !a.startsWith('--') && !a.startsWith('-') && !tags.includes(a));
  const title = positional[0];
  const nextTitle = positional[1] || title;

  try {
    const result = handoff(title, { nextTitle, dryRun, auto, tags });

    if (dryRun) {
      console.log('━'.repeat(60));
      console.log('🔍 DRY-RUN: 接续 prompt 预览');
      console.log('━'.repeat(60));
      console.log(result.prompt);
      console.log('━'.repeat(60));
      console.log('(未写入快照；删除 --dry-run 实际执行)');
      return;
    }

    console.log('✅ 会话交接完成');
    console.log(`   快照：${result.snapshotPath}`);
    console.log(`   状态：${result.autonomousStatePath}`);
    console.log(`   next 入队：${result.enqueued ? '✅' : '⏭️ 已存在'}`);
    console.log('');
    console.log('━'.repeat(60));
    console.log('📋 接续 prompt（新子会话第一句）');
    console.log('━'.repeat(60));
    console.log(result.prompt);
    console.log('━'.repeat(60));

    if (auto) {
      console.log('');
      console.log('🚀 --auto 模式：正在启动新子会话自动接续...');
      spawnClaudeContinuation(result.prompt, nextTitle || title).then((r) => {
        if (r.error) {
          console.error(`❌ 子会话启动失败: ${r.error}`);
          process.exit(1);
        }
        console.log(`✅ 子会话结束 (code=${r.code})`);
      });
    } else {
      console.log('');
      console.log('💡 建议操作：');
      console.log('   1. 加 --auto 一条命令完成（推荐）');
      console.log('   2. 手动：在 Claude Code UI 点击 "New Chat"');
      console.log('   3. 手动：输入 /clear 后粘上面 prompt');
    }
  } catch (e) {
    console.error(`❌ handoff 失败: ${e.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  handoff,
  buildHandoffPrompt,
  saveSnapshot,
  markAwaitingHandoff,
  clearAwaitingHandoff,
  loadAutonomousState,
  loadSnapshot,
};
