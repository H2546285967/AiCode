#!/usr/bin/env node
/**
 * workflow-cli.js — 个人 workflow 智能化统一入口（v2.0 P0-5）
 *
 * 作用：
 *   - 提供 /workflow 命令的底层实现
 *   - 串联 observer / miner / suggestion-engine
 *   - 支持手动记录、学习、建议、状态查看
 *
 * 子命令：
 *   suggest     获取当前建议（默认）
 *   learn       重新挖掘模式
 *   record      手动记录事件
 *   status      查看 workflow 状态
 *   context     查看当前上下文
 *
 * 用法：
 *   node workflow-cli.js suggest
 *   node workflow-cli.js learn
 *   node workflow-cli.js record command_run '{"command":"npm test"}'
 *   node workflow-cli.js status
 *
 * @since v2.0.2 (2026-06-25)
 * @source 03_版本迭代计划.md §五 v2.0 P0-5
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const SKILL_DIR = path.join(WORKSPACE_ROOT, '.claude', 'skills', 'left-brain');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');

// 加载依赖
function loadModule(name) {
  try {
    return require(path.join(__dirname, name));
  } catch (e) {
    process.stderr.write(`[workflow-cli] load ${name} failed: ${e.message}\n`);
    return null;
  }
}

const Observer = loadModule('./workflow-observer');
const Miner = loadModule('./pattern-miner');
const Suggest = loadModule('./suggestion-engine');

// ── 子命令实现 ───────────────────────────────────────

function cmdSuggest(args) {
  if (!Suggest) {
    console.error('❌ suggestion-engine 加载失败');
    return 1;
  }
  const hours = parseFloat(args[0]) || 2;
  const topK = parseInt(args[1], 10) || 3;
  const suggestions = Suggest.suggest({ hours, topK });
  console.log(Suggest.format(suggestions));
  return 0;
}

function cmdLearn(args) {
  if (!Miner) {
    console.error('❌ pattern-miner 加载失败');
    return 1;
  }
  const opts = {
    minSupport: parseFloat(args[0]) || 2,
    minConfidence: parseFloat(args[1]) || 0.5,
    windowMinutes: parseFloat(args[2]) || 30,
  };
  const result = Miner.mineAndSave(opts);
  console.log(`✅ 已重新学习 workflow 模式`);
  console.log(`  分析事件: ${result.stats.totalEvents}`);
  console.log(`  发现模式: ${result.stats.patternsFound}`);
  if (result.patterns.length > 0) {
    console.log(`  高频模式:`);
    for (const p of result.patterns.slice(0, 5)) {
      const triggerDesc = JSON.stringify(p.trigger);
      const actionDesc = JSON.stringify(p.action);
      console.log(`    • ${triggerDesc} → ${actionDesc} (${Math.round(p.confidence * 100)}%, ${p.support} 次)`);
    }
  }
  return 0;
}

function cmdRecord(args) {
  if (!Observer) {
    console.error('❌ workflow-observer 加载失败');
    return 1;
  }
  const type = args[0];
  const payloadStr = args[1] || '{}';
  const metaStr = args[2] || '{}';
  let payload = {};
  let meta = {};
  try {
    payload = JSON.parse(payloadStr);
    meta = JSON.parse(metaStr);
  } catch {
    console.error('❌ payload / meta 必须是合法 JSON');
    return 1;
  }
  const ev = Observer.record(type, payload, meta);
  if (ev) {
    console.log('✅ 已记录:', JSON.stringify(ev));
    return 0;
  }
  console.error('❌ 记录失败');
  return 1;
}

function cmdStatus() {
  const lines = [];
  lines.push('📊 个人 workflow 智能化状态');

  if (Observer) {
    const stats = Observer.stats(24 * 7); // 最近 7 天
    lines.push(`  事件采集: ${stats.total} 条（最近 7 天）`);
    if (Object.keys(stats.byType).length > 0) {
      for (const [t, c] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        lines.push(`    - ${t}: ${c}`);
      }
    }
  }

  if (Miner) {
    const data = Miner.loadPatterns();
    const count = data?.patterns?.length || 0;
    lines.push(`  学习模式: ${count} 条`);
    if (data?.ts) {
      lines.push(`    最近学习: ${data.ts.slice(0, 19)}`);
    }
  }

  if (Suggest) {
    const ctx = Suggest.context(2);
    lines.push(`  当前上下文: 最近 2 小时 ${ctx.recentEvents} 个事件，${ctx.uncommitted} 个未提交改动`);
  }

  console.log(lines.join('\n'));
  return 0;
}

function cmdContext(args) {
  if (!Suggest) {
    console.error('❌ suggestion-engine 加载失败');
    return 1;
  }
  const hours = parseFloat(args[0]) || 2;
  const ctx = Suggest.context(hours);
  console.log(JSON.stringify(ctx, null, 2));
  return 0;
}

function cmdHelp() {
  console.log(`
workflow-cli.js — 个人 workflow 智能化统一入口

用法:
  node workflow-cli.js suggest [hours=2] [topK=3]    # 获取当前建议
  node workflow-cli.js learn [support=2] [conf=0.5] [window=30]  # 重新学习模式
  node workflow-cli.js record <type> <payload_json>  # 手动记录事件
  node workflow-cli.js status                          # 查看状态
  node workflow-cli.js context [hours=2]               # 查看上下文

事件类型:
  file_modified, command_run, test_run, commit,
  plan_created, plan_approved, session_start, session_end

示例:
  node workflow-cli.js suggest
  node workflow-cli.js record command_run '{"command":"npm test"}'
`);
  return 0;
}

// ── 主入口 ───────────────────────────────────────────

function main() {
  const cmd = process.argv[2] || 'suggest';
  const args = process.argv.slice(3);

  try {
    switch (cmd) {
      case 'suggest': return cmdSuggest(args);
      case 'learn': return cmdLearn(args);
      case 'record': return cmdRecord(args);
      case 'status': return cmdStatus();
      case 'context': return cmdContext(args);
      case 'help':
      case '--help':
      case '-h':
      default:
        return cmdHelp();
    }
  } catch (e) {
    console.error('❌ 异常:', e.message);
    return 1;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  cmdSuggest,
  cmdLearn,
  cmdRecord,
  cmdStatus,
  cmdContext,
};
