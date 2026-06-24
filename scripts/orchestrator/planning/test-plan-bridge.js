#!/usr/bin/env node
/**
 * plan-bridge.js 单元测试
 * 验证：buildStepPrompt / executePlan (mock) / dry-run / 日志 / 失败继续 / 状态机
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  buildStepPrompt,
  executePlan,
  executeLatest,
  findLatestApproved,
  EXECUTION_LOG_FILE,
} = require('./plan-bridge');

const {
  parsePlanBlock,
  applyFallback,
} = require('./plan-detect');

let pass = 0, fail = 0;
const fails = [];

function assert(cond, name, detail) {
  if (cond) {
    pass++;
  } else {
    fail++;
    fails.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// 准备 approved plan
const PLANS_FILE = path.join(__dirname, '..', '..', '..', '.claude', 'skills', 'left-brain', 'memory', 'pending-plans.json');

function writeTestPlan(planId = 'plan-test-bridge') {
  const plans = [{
    id: planId,
    timestamp: new Date().toISOString(),
    status: 'approved',
    approved_at: new Date().toISOString(),
    plan: {
      task: '重构 dispatcher',
      goal: '拆成 3 个子模块',
      steps: [
        { text: '读 dispatcher.js 现状', agent: 'explorer', files: ['dispatcher.js'] },
        { text: '拆成 3 个子模块', agent: 'planner', files: ['dispatcher.js', 'sub-router.js'] },
        { text: '写测试', agent: 'qa-reviewer' },
      ],
    },
  }];
  fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2));
  return planId;
}

function clearPlans() {
  try { fs.unlinkSync(PLANS_FILE); } catch {}
}

function clearLog() {
  try { fs.unlinkSync(EXECUTION_LOG_FILE); } catch {}
}

// ==================== 1. buildStepPrompt ====================
section('buildStepPrompt: 构造 dispatch prompt');

// 基本 prompt
{
  const plan = { task: '重构 dispatcher', goal: '拆成 3 个模块' };
  const step = { text: '读 dispatcher.js 现状', agent: 'explorer', files: ['dispatcher.js'] };
  const prompt = buildStepPrompt(plan, step, 0, 3);
  assert(prompt.includes('explorer'), '含 agent 类型');
  assert(prompt.includes('重构 dispatcher'), '含 plan.task');
  assert(prompt.includes('拆成 3 个模块'), '含 plan.goal');
  assert(prompt.includes('读 dispatcher.js 现状'), '含 step.text');
  assert(prompt.includes('dispatcher.js'), '含 step.files');
  assert(prompt.includes('1 / 3'), '含进度 1/3');
}

// 无 goal 也不崩
{
  const plan = { task: 'X' };
  const step = { text: 'y', agent: 'claude', files: [] };
  const prompt = buildStepPrompt(plan, step, 1, 2);
  assert(prompt.includes('X'), '含 task');
  assert(prompt.includes('2 / 2'), '含进度 2/2');
  assert(prompt.includes('（无）'), '无 files 时显示（无）');
}

// ==================== 2. parsePlanBlock + applyFallback 兼容 ====================
section('plan 协议向后兼容');

// 旧格式（步骤为字符串）
{
  const oldText = `任务: X
步骤:
  1. 读 a.js
  2. 改 b.js`;
  const parsed = parsePlanBlock(oldText);
  assert(parsed.steps.length === 2, '旧格式 2 步');
  assert(typeof parsed.steps[0] === 'object', 'step 是对象（不是字符串）');
  assert(parsed.steps[0].text === '读 a.js', 'text 字段正确');
  // 应用 fallback
  const filled = applyFallback(parsed.steps[0]);
  assert(filled.agent === 'claude', 'fallback agent=claude');
  assert(filled.files.length > 0, 'fallback 从 text 提取 files', `files=${JSON.stringify(filled.files)}`);
}

// 新格式
{
  const newText = `任务: Y
步骤:
  1. 读 a.js
     agent: explorer
     files: a.js, b.js`;
  const parsed = parsePlanBlock(newText);
  assert(parsed.steps[0].agent === 'explorer', '新格式 agent 正确');
  assert(parsed.steps[0].files.length === 2, '新格式 files 数组', JSON.stringify(parsed.steps[0].files));
  const filled = applyFallback(parsed.steps[0]);
  assert(filled.agent === 'explorer', '新格式不应用 agent fallback');
  assert(filled.files.length === 2, '新格式不应用 files fallback');
}

// ==================== 3. findLatestApproved ====================
section('findLatestApproved');

clearPlans();
{
  const r = findLatestApproved();
  assert(r === null, '无 approved plan 时返回 null');
}

writeTestPlan();
{
  const r = findLatestApproved();
  assert(r !== null, '找到 approved plan');
  assert(r.id === 'plan-test-bridge', 'id 正确');
  assert(r.plan.steps.length === 3, 'steps 3 步');
}

// ==================== 4. executePlan dry-run ====================
section('executePlan: dry-run 模式');

clearLog();
writeTestPlan();
{
  const r = executePlan('plan-test-bridge', { dryRun: true });
  assert(r.ok, '执行成功');
  assert(r.executed === 0, 'dry-run 不算 executed');
  assert(r.failed === 0, 'dry-run 不算 failed');
  assert(r.results.length === 3, '3 个 step result');
  assert(r.results[0].dryRun === true, 'result 含 dryRun=true');
  assert(r.results[0].prompt !== undefined, 'dry-run 含 prompt');
  // plan 状态仍为 approved（dry-run 不改）
  const plans = JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'));
  const plan = plans.find(p => p.id === 'plan-test-bridge');
  assert(plan.status === 'approved', 'dry-run 不改 plan 状态');
}

// ==================== 5. executePlan: 计划不存在 ====================
section('executePlan: 错误处理');

{
  const r = executePlan('nonexistent-plan', { dryRun: true });
  assert(!r.ok, 'plan 不存在时 ok=false');
  assert(r.error.includes('not found'), 'error 信息含 not found');
}

// plan 状态不对
{
  const plans = JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'));
  plans[0].status = 'pending';
  fs.writeFileSync(PLANS_FILE, JSON.stringify(plans));
  const r = executePlan('plan-test-bridge', { dryRun: true });
  assert(!r.ok, '非 approved 状态时 ok=false');
  assert(r.error.includes('pending'), 'error 信息含状态');
  // 恢复
  writeTestPlan();
}

// ==================== 6. executeLatest ====================
section('executeLatest: 找最新 approved');

clearPlans();
{
  const r = executeLatest({ dryRun: true });
  assert(!r.ok, '无 approved plan 时 ok=false');
  assert(r.error.includes('no approved'), 'error 信息正确');
}

writeTestPlan();
{
  const r = executeLatest({ dryRun: true });
  assert(r.ok, '找到并执行');
  assert(r.results.length === 3, '3 个 step');
}

// ==================== 7. CLI 入口 ====================
section('CLI 入口');

// execute-latest 无 plan
clearPlans();
{
  const out = execFileSync('node', ['plan-bridge.js', 'execute-latest'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('no approved') || out.includes('提示'), '无 plan 时友好提示');
}

// list-approved
writeTestPlan();
{
  const out = execFileSync('node', ['plan-bridge.js', 'list-approved'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('plan-test-bridge'), '列出 test plan');
}

// execute-latest --dry-run
{
  const out = execFileSync('node', ['plan-bridge.js', 'execute-latest', '--dry-run'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('Dry-run') || out.includes('执行'), 'dry-run 模式输出');
  assert(out.includes('explorer'), '含 step agent');
}

// log
{
  const out = execFileSync('node', ['plan-bridge.js', 'log'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('无执行日志') || out.includes('执行日志'), 'log 命令输出');
}

// help (默认无参数)
{
  let code = 0;
  try {
    execFileSync('node', ['plan-bridge.js'], { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  // 无参数 = 显示 help，正常 exit 0
  assert(code === 0, '无参数 help exit 0', `code=${code}`);
}

// ==================== 8. 永不 throw ====================
section('永不 throw');

clearPlans();
{
  let code = 0;
  try {
    execFileSync('node', ['plan-bridge.js', 'execute-latest'], { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  assert(code === 0, 'execute-latest 始终 exit 0', `code=${code}`);
}

// ==================== 清理 ====================
clearPlans();
clearLog();

// ==================== 汇总 ====================
console.log('\n========================================');
console.log(`📊 plan-bridge 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
console.log('========================================');
if (fail > 0) {
  console.log('\n失败项:');
  for (const f of fails) console.log(`  - ${f.name}${f.detail ? '  → ' + f.detail : ''}`);
}
process.exit(fail > 0 ? 1 : 0);