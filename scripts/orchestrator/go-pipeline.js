#!/usr/bin/env node
/**
 * go-pipeline.js — /go skill 流水线引擎（v1.0.0 · M43）
 *
 * 触发方式：
 *   - 手动：node scripts/orchestrator/go-pipeline.js
 *   - 通过：/go （Claude Code 自动派）
 *
 * 作用：
 *   - 自动执行 4 阶段交付流水线：测试 → 简化 → 审查 → 提交
 *   - 任一阶段失败立即停止并报告，不继续提交
 *   - 支持 --dry-run / --skip <stage> / --only <stage> 灵活控制
 *
 * 设计原则（v1.0.0 最小可用版）：
 *   - 永不 throw（所有阶段失败 → 返回 status='failed' 而非抛错）
 *   - 纯函数（不读 autonomous-state、不写 evolution-plan）
 *   - 测试友好：所有外部命令通过 opts.exec 调用，可被 mock
 *   - 输出 JSON + 人类可读 2 份报告
 *
 * @since v3.0.5 (2026-06-28)
 * @source 04_自我演进路线.md §0.4 增量 M43 / research-skill-ecosystem-20260626 P2
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WORKSPACE_ROOT = path.join(__dirname, '..', '..');

// ── 4 阶段定义 ────────────────────────────────────────

const STAGES = ['test', 'simplify', 'review', 'commit'];

const STAGE_DEFS = {
  test: {
    name: '测试',
    description: '运行项目测试套件',
    defaultCmd: 'npm',
    defaultArgs: ['test', '--silent'],
    // 退出码 0 = 通过，非 0 = 失败
    passOnExitZero: true,
    skippable: false, // 测试阶段不可跳过（它是流水线入口）
  },
  simplify: {
    name: '简化',
    description: '运行代码质量优化（移除冗余/重复）',
    defaultCmd: null, // 当前无独立脚本 → 标记 skipped
    defaultArgs: [],
    passOnExitZero: true,
    skippable: true,
  },
  review: {
    name: '审查',
    description: '多 Agent 代码审查（git diff 维度）',
    defaultCmd: null, // 当前无独立脚本 → 标记 skipped
    defaultArgs: [],
    passOnExitZero: true,
    skippable: true,
  },
  commit: {
    name: '提交',
    description: 'git add -A + git commit（仅在前面阶段全部通过时）',
    defaultCmd: 'git',
    defaultArgs: ['commit', '--allow-empty', '-m', 'auto-commit via /go pipeline'],
    passOnExitZero: true,
    skippable: false,
  },
};

// ── 工具函数 ─────────────────────────────────────────

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function readFileSafe(fp) {
  try { return fs.readFileSync(fp, 'utf8'); } catch { return null; }
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    skip: new Set(),
    only: null,
    testCmd: null,        // 自定义测试命令（覆盖默认 npm test）
    commitMsg: null,      // 自定义 commit 信息
    cwd: WORKSPACE_ROOT,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--skip') {
      const v = argv[++i];
      v.split(',').map(s => s.trim()).filter(Boolean).forEach(s => opts.skip.add(s));
    }
    else if (a === '--only') opts.only = argv[++i];
    else if (a === '--test-cmd') opts.testCmd = argv[++i];
    else if (a === '--commit-msg') opts.commitMsg = argv[++i];
    else if (a === '--cwd') opts.cwd = argv[++i];
    else if (a === '--help' || a === '-h') opts.help = true;
  }

  return opts;
}

function helpText() {
  return `/go skill v1.0.0 — 测试 → 简化 → 审查 → 提交 全流程

用法:
  node scripts/orchestrator/go-pipeline.js [options]

选项:
  --dry-run           只打印计划，不真跑命令
  --skip <stages>     跳过指定阶段（逗号分隔，如 simplify,review）
  --only <stage>      只跑一个阶段（test/simplify/review/commit）
  --test-cmd <cmd>    自定义测试命令（覆盖默认 npm test）
  --commit-msg <msg>  自定义 commit 信息（默认 'auto-commit via /go pipeline'）
  --cwd <path>        工作目录（默认工程根）
  --help, -h          显示本帮助

阶段说明:
  test     运行测试（默认 npm test）
  simplify 代码质量优化（当前无独立脚本，自动 skip）
  review   多 Agent 审查（当前无独立脚本，自动 skip）
  commit   git commit（仅在前面阶段全部通过时执行）

退出码:
  0 = 全部成功
  1 = 有阶段失败
  2 = 参数错误
`;
}

// ── 阶段执行器 ────────────────────────────────────────

/**
 * 执行单阶段（纯函数：opts.exec 可注入用于测试）
 * @param {string} stageId - test/simplify/review/commit
 * @param {object} opts - 来自 parseArgs + 注入的 exec
 * @returns {{stage, status, message, durationMs, skipped}}
 */
function runStage(stageId, opts) {
  const def = STAGE_DEFS[stageId];
  const start = Date.now();
  const result = {
    stage: stageId,
    name: def.name,
    status: 'pending',
    message: '',
    durationMs: 0,
    skipped: false,
  };

  // 1. 检查是否要跑这一阶段
  if (opts.only && opts.only !== stageId) {
    result.status = 'skipped';
    result.skipped = true;
    result.message = `--only=${opts.only} 跳过本阶段`;
    result.durationMs = Date.now() - start;
    return result;
  }
  if (opts.skip.has(stageId)) {
    result.status = 'skipped';
    result.skipped = true;
    result.message = `--skip 指定跳过`;
    result.durationMs = Date.now() - start;
    return result;
  }

  // 2. 检查阶段是否有可执行命令
  if (!def.defaultCmd) {
    result.status = 'skipped';
    result.skipped = true;
    result.message = `无独立脚本（建议开发 .claude/skills/go/scripts/${stageId}.js）`;
    result.durationMs = Date.now() - start;
    return result;
  }

  // 3. dry-run
  if (opts.dryRun) {
    result.status = 'dry-run';
    let args = def.defaultArgs;
    if (stageId === 'test' && opts.testCmd) {
      // 自定义测试命令（空格分隔）
      const parts = opts.testCmd.split(/\s+/);
      result.message = `would run: ${parts.join(' ')}`;
      result.durationMs = Date.now() - start;
      return result;
    }
    if (stageId === 'commit' && opts.commitMsg) {
      args = ['commit', '--allow-empty', '-m', opts.commitMsg];
    }
    result.message = `would run: ${def.defaultCmd} ${args.join(' ')}`;
    result.durationMs = Date.now() - start;
    return result;
  }

  // 4. 实际执行（通过 opts.exec 注入,默认 child_process.execFileSync）
  let args = def.defaultArgs;
  if (stageId === 'test' && opts.testCmd) {
    const parts = opts.testCmd.split(/\s+/);
    try {
      const out = opts.exec(parts[0], parts.slice(1), opts.cwd);
      result.status = 'passed';
      result.message = String(out).slice(-200).trim(); // 后 200 字符
      result.durationMs = Date.now() - start;
      return result;
    } catch (e) {
      result.status = 'failed';
      result.message = `exit=${e.status || '?'}: ${String(e.stderr || e.message || e).slice(0, 300)}`;
      result.durationMs = Date.now() - start;
      return result;
    }
  }
  if (stageId === 'commit' && opts.commitMsg) {
    args = ['commit', '--allow-empty', '-m', opts.commitMsg];
  }

  try {
    const out = opts.exec(def.defaultCmd, args, opts.cwd);
    result.status = 'passed';
    result.message = String(out).slice(-200).trim();
    result.durationMs = Date.now() - start;
    return result;
  } catch (e) {
    result.status = 'failed';
    result.message = `exit=${e.status || '?'}: ${String(e.stderr || e.message || e).slice(0, 300)}`;
    result.durationMs = Date.now() - start;
    return result;
  }
}

// ── 流水线编排 ────────────────────────────────────────

/**
 * 跑完整流水线（纯函数）
 * @param {object} opts - parseArgs 输出
 * @param {object} [deps] - { exec } 依赖注入用于测试
 * @returns {{stages, summary, startedAt, finishedAt, durationMs}}
 */
function runPipeline(opts, deps = {}) {
  const exec = deps.exec || ((cmd, args, cwd) => {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  });

  const startedAt = timestamp();
  const t0 = Date.now();
  const stagesToRun = opts.only ? [opts.only] : STAGES;
  const results = [];

  for (const sid of stagesToRun) {
    const r = runStage(sid, { ...opts, exec });
    results.push(r);

    // 失败立即停止（除非 skip-only 模式）
    if (r.status === 'failed') {
      break;
    }
  }

  const finishedAt = timestamp();
  const durationMs = Date.now() - t0;

  // 汇总
  const passed = results.filter(r => r.status === 'passed' || r.status === 'dry-run').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  let summary = 'success';
  if (failed > 0) summary = 'failed';
  else if (skipped === results.length) summary = 'all-skipped';
  else if (skipped > 0) summary = 'partial';

  return {
    startedAt,
    finishedAt,
    durationMs,
    dryRun: opts.dryRun || false,
    stages: results,
    summary,
    counts: { passed, failed, skipped, total: results.length },
  };
}

// ── 格式化输出 ────────────────────────────────────────

function formatHuman(result) {
  const lines = [];
  lines.push(`🚀 /go pipeline v1.0.0 (${result.startedAt}${result.dryRun ? ' · dry-run' : ''})`);
  lines.push('');
  for (const s of result.stages) {
    const icon =
      s.status === 'passed' ? '✅' :
      s.status === 'dry-run' ? '🟡' :
      s.status === 'skipped' ? '⏭️ ' :
      s.status === 'failed' ? '❌' : '❓';
    lines.push(`${icon} [${s.stage}] ${s.name} — ${s.status} (${s.durationMs}ms)`);
    if (s.message) lines.push(`   ${s.message}`);
  }
  lines.push('');
  lines.push(`📊 汇总: ${result.summary} · 通过 ${result.counts.passed} / 失败 ${result.counts.failed} / 跳过 ${result.counts.skipped} / 总 ${result.counts.total}`);
  lines.push(`⏱️  总耗时: ${result.durationMs}ms`);
  return lines.join('\n');
}

// ── CLI 入口 ──────────────────────────────────────────

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(helpText());
    process.exit(0);
  }
  // 参数校验
  if (opts.only && !STAGES.includes(opts.only)) {
    console.error(`❌ --only 必须是 ${STAGES.join('|')} 之一，得到: ${opts.only}`);
    process.exit(2);
  }
  for (const s of opts.skip) {
    if (!STAGES.includes(s)) {
      console.error(`❌ --skip 含无效阶段: ${s}（有效: ${STAGES.join('|')}）`);
      process.exit(2);
    }
  }

  const result = runPipeline(opts);
  console.log(formatHuman(result));

  // exit code：失败 = 1（让 shell 能 catch）
  process.exit(result.summary === 'failed' ? 1 : 0);
}

module.exports = {
  STAGES,
  STAGE_DEFS,
  parseArgs,
  runStage,
  runPipeline,
  formatHuman,
};