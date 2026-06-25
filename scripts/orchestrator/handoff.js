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
const { execFileSync } = require('child_process');

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
 * 主入口
 */
function handoff(title, opts = {}) {
  const { nextTitle, dryRun = false, tags = ['handoff'] } = opts;

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

  return {
    saved: true,
    snapshotPath: SNAPSHOT_FILE,
    autonomousStatePath: AUTONOMOUS_STATE_FILE,
    prompt,
  };
}

// ── CLI ───────────────────────────────────────────────

function showHelp() {
  console.log(`
handoff.js — 会话切换助手（v3.0.4 M21）

用法:
  node handoff.js "标题" [next-title]         # 强制存快照 + 生成接续 prompt
  node handoff.js "标题" --dry-run            # 只打印 prompt 不写

参数:
  第一个 (必填)   当前会话标题（写快照用）
  第二个 (可选)   下一阶段标题（默认 = 第一个）
  --dry-run       只打印接续 prompt，不写快照
  --tags "tag1 tag2"  自定义快照标签

示例:
  node handoff.js "M19 完成" "M20: decision-assistant.js"
  node handoff.js "决策讨论完成" --dry-run
  node handoff.js "M20 完成" "M21: /handoff 命令" --tags "milestone handoff"

输出:
  1. 自动存快照到 .claude/skills/left-brain/memory/sessions/latest_state.json
  2. 标记 autonomous-state.json.awaiting_handoff = true
  3. 输出"接续 prompt"（下一个新会话直接粘进去）
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const tagsIdx = args.indexOf('--tags');
  const tags = tagsIdx !== -1 ? args[tagsIdx + 1].split(/\s+/) : ['handoff'];

  // 解析位置参数
  const positional = args.filter(a => !a.startsWith('--') && !tags.includes(a));
  const title = positional[0];
  const nextTitle = positional[1] || title;

  try {
    const result = handoff(title, { nextTitle, dryRun, tags });

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
    console.log('');
    console.log('━'.repeat(60));
    console.log('📋 接续 prompt（粘到新会话第一句）');
    console.log('━'.repeat(60));
    console.log(result.prompt);
    console.log('━'.repeat(60));
    console.log('');
    console.log('💡 建议操作：');
    console.log('   1. 在 Claude Code UI 点击 "New Chat" / 输入 /clear');
    console.log('   2. 新会话第一句：粘上面的接续 prompt');
    console.log('   3. session-init.sh 会自动加载 latest_state.json');
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
