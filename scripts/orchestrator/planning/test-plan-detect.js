#!/usr/bin/env node
/**
 * plan-detect.js 单元测试
 * 验证 plan 提取 / 解析 / 写入 / 批准 / 取消 / CLI 入口
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  extractPlanBlocks,
  parsePlanBlock,
  detectPlans,
  approveLatest,
  cancelLatest,
  listPending,
  PENDING_PLANS_FILE,
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

function clearPlans() {
  try { fs.unlinkSync(PENDING_PLANS_FILE); } catch {}
}

// ==================== 1. extractPlanBlocks 边界 ====================
section('extractPlanBlocks 边界');

// 单 plan 块
{
  const r = extractPlanBlocks('前面 [plan]任务: 测试[/plan] 后面');
  assert(r.length === 1, '单 plan 块提取');
  assert(r[0].includes('任务: 测试'), '提取内文正确');
}

// 多 plan 块
{
  const r = extractPlanBlocks('[plan]一[/plan] 中间 [plan]二[/plan]');
  assert(r.length === 2, '多 plan 块', `count=${r.length}`);
}

// 大小写不敏感
{
  const r = extractPlanBlocks('[PLAN]一[/PLAN]');
  assert(r.length === 1, '大写 [PLAN] 也能识别');
}

// 无 plan 块
{
  const r = extractPlanBlocks('普通文本');
  assert(r.length === 0, '无 plan 块');
}

// 空字符串
{
  const r = extractPlanBlocks('');
  assert(r.length === 0, '空字符串');
}

// null/undefined
{
  assert(extractPlanBlocks(null).length === 0, 'null 不崩');
  assert(extractPlanBlocks(undefined).length === 0, 'undefined 不崩');
}

// 多行 plan
{
  const text = `[plan]
任务: 多行测试
步骤:
  1. 第一步
  2. 第二步
[/plan]`;
  const r = extractPlanBlocks(text);
  assert(r.length === 1, '多行 plan 提取');
  assert(r[0].includes('多行测试'), '内文含 task');
}

// ==================== 2. parsePlanBlock 解析 ====================
section('parsePlanBlock 解析');

// 完整 plan
{
  const block = `任务: 实现 X
目标: 让 X 工作
步骤:
  1. 写代码
  2. 写测试
  3. commit
预计改动: 3 个文件
预计风险: 低
回退方案: git revert`;
  const r = parsePlanBlock(block);
  assert(r && r.task === '实现 X', 'task 字段');
  assert(r && r.goal === '让 X 工作', 'goal 字段');
  assert(r && r.steps.length === 3, 'steps 数', `steps=${r?.steps.length}`);
  assert(r && r.estimated_changes === '3 个文件', 'estimated_changes');
  assert(r && r.estimated_risk === '低', 'estimated_risk');
  assert(r && r.rollback === 'git revert', 'rollback');
}

// 英文冒号 + 有 steps（必须是完整 plan 才算）
{
  const block = `任务: test
步骤:
  1. do something`;
  const r = parsePlanBlock(block);
  assert(r && r.task === 'test', '英文冒号 + steps 也支持');
}

// 中文数字步骤
{
  const block = `任务: 测试
步骤:
  1) 第一步
  2) 第二步`;
  const r = parsePlanBlock(block);
  assert(r && r.steps.length === 2, '数字括号步骤', `steps=${r?.steps.length}`);
}

// 只有 task 无 steps（不算有效 plan）
{
  const r = parsePlanBlock('任务: 只有任务');
  assert(r === null, '无 steps 不算 plan');
}

// 只有 steps 无 task（也不算有效 plan）
{
  const r = parsePlanBlock('步骤:\n  1. 第一步');
  assert(r === null, '无 task 不算 plan');
}

// 空 plan 块
{
  const r = parsePlanBlock('');
  assert(r === null, '空 plan 块');
}

// ==================== 3. detectPlans 集成 ====================
section('detectPlans 集成');

// 真实 plan 触发
{
  clearPlans();
  const text = `我先看下代码... 这是我的计划：

[plan]
任务: 重构登录
目标: 让登录性能提升 50%
步骤:
  1. 改 LoginController
  2. 改 Redis 缓存
  3. 加测试
预计改动: 5 个文件
预计风险: 中
回退方案: git revert HEAD
[/plan]

请 /ok 批准。`;

  const written = detectPlans(text);
  assert(written.length === 1, '真实 plan 触发写入', `written=${written.length}`);
  assert(written[0].status === 'pending', '状态 pending');
  assert(written[0].plan.task === '重构登录', 'task 正确');

  // JSONL 落盘验证
  assert(fs.existsSync(PENDING_PLANS_FILE), 'pending-plans 文件已生成');
  const plans = JSON.parse(fs.readFileSync(PENDING_PLANS_FILE, 'utf8'));
  assert(plans.length === 1, '落盘 1 条');
  assert(plans[0].status === 'pending', '落盘 status 正确');
}

// 无 plan 块
{
  clearPlans();
  const written = detectPlans('普通输出无 plan');
  assert(written.length === 0, '无 plan 块 → 不写入');
  assert(!fs.existsSync(PENDING_PLANS_FILE), '无 plan 块 → 无文件');
}

// 去重：同 plan 文本不重复
{
  clearPlans();
  const text = `[plan]
任务: 重复测试
步骤:
  1. x
[/plan]`;
  detectPlans(text);
  const written2 = detectPlans(text);
  assert(written2.length === 0, '同 plan 文本不重复', `written2=${written2.length}`);
}

// 多 plan 块 → 都写入
{
  clearPlans();
  const text = `[plan]
任务: 一
步骤:
  1. x
[/plan] 中间 [plan]
任务: 二
步骤:
  1. y
[/plan]`;
  const written = detectPlans(text);
  assert(written.length === 2, '多 plan 块都写入', `count=${written.length}`);
}

// ==================== 4. approve / cancel ====================
section('approve / cancel');

clearPlans();
detectPlans(`[plan]
任务: 待批准
步骤:
  1. 一
[/plan]`);

// 批准
{
  const r = approveLatest();
  assert(r && r.status === 'approved', '批准后 status = approved');
  assert(r && r.approved_at, '含 approved_at 时间戳');

  // 落盘验证
  const plans = JSON.parse(fs.readFileSync(PENDING_PLANS_FILE, 'utf8'));
  assert(plans[0].status === 'approved', '落盘 status 已更新');
}

// 取消（在批准后再写一条）
clearPlans();
detectPlans(`[plan]
任务: 待取消
步骤:
  1. 一
[/plan]`);

{
  const r = cancelLatest();
  assert(r && r.status === 'cancelled', '取消后 status = cancelled');
  assert(r && r.cancelled_at, '含 cancelled_at');

  const plans = JSON.parse(fs.readFileSync(PENDING_PLANS_FILE, 'utf8'));
  assert(plans[0].status === 'cancelled', '落盘 status 已更新');
}

// 批准/取消无 pending 时
{
  clearPlans();
  assert(approveLatest() === null, '无 pending → approve 返回 null');
  assert(cancelLatest() === null, '无 pending → cancel 返回 null');
}

// ==================== 5. listPending ====================
section('listPending');

clearPlans();
detectPlans(`[plan]
任务: A
步骤:
  1. 一
[/plan]`);
detectPlans(`[plan]
任务: B
步骤:
  1. 二
[/plan]`);

{
  const pending = listPending();
  assert(pending.length === 2, '2 个 pending');
  assert(pending[0].plan.task === 'A', '第一个 task');
  assert(pending[1].plan.task === 'B', '第二个 task');

  // 批准第一个后应只剩 1 个 pending
  approveLatest();
  const remaining = listPending();
  assert(remaining.length === 1, '批准后剩 1 个 pending');
  assert(remaining[0].plan.task === 'A', '剩下的还是 A');
}

// ==================== 6. CLI 入口 ====================
section('CLI 入口');

clearPlans();

// detect 命令（直接文本）
{
  const text = `[plan]
任务: CLI 测试
步骤:
  1. 一
[/plan]`;
  const out = execFileSync('node', ['plan-detect.js', 'detect', text], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('检测到 1 个 plan'), 'CLI detect 触发');
}

// approve 命令
{
  const out = execFileSync('node', ['plan-detect.js', 'approve'], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('已批准'), 'CLI approve 输出');
}

// list 命令（应空，因刚批准了）
{
  const out = execFileSync('node', ['plan-detect.js', 'list'], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('无 pending'), 'CLI list 空状态');
}

// cancel 命令
clearPlans();
detectPlans(`[plan]
任务: 取消测试
步骤:
  1. 一
[/plan]`);
{
  const out = execFileSync('node', ['plan-detect.js', 'cancel'], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('已取消'), 'CLI cancel 输出');
}

// 无 pending approve
clearPlans();
{
  const out = execFileSync('node', ['plan-detect.js', 'approve'], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('无待批准'), '无 pending 时 approve 提示');
}

// 未知命令 exit 1
{
  let code = 0;
  try {
    execFileSync('node', ['plan-detect.js', 'unknown-cmd'], {
      cwd: __dirname, stdio: 'pipe',
    });
  } catch (e) {
    code = e.status;
  }
  assert(code === 1, '未知命令 exit 1', `code=${code}`);
}

// ==================== 清理 ====================
clearPlans();

// ==================== 汇总 ====================
console.log('\n========================================');
console.log(`📊 plan-detect 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
console.log('========================================');
if (fail > 0) {
  console.log('\n失败项:');
  for (const f of fails) console.log(`  - ${f.name}${f.detail ? '  → ' + f.detail : ''}`);
}
process.exit(fail > 0 ? 1 : 0);