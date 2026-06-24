#!/usr/bin/env node
/**
 * autonomous.js 单元测试
 * 验证：enable/disable/toggle/isEnabled/formatStatusLine + 状态文件持久化 + CLI
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  enable,
  disable,
  toggle,
  isEnabled,
  getState,
  loadState,
  saveState,
  formatStatusLine,
  STATE_FILE,
} = require('./autonomous');

let pass = 0, fail = 0;
const fails = [];

function assert(cond, name, detail) {
  if (cond) { pass++; }
  else {
    fail++;
    fails.push({ name, detail });
    console.log(`  ❌ ${name}${detail ? '  → ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

function clearState() {
  try { fs.unlinkSync(STATE_FILE); } catch {}
}

// ==================== 1. 默认状态 ====================
section('默认状态');

clearState();
{
  const s = getState();
  assert(s.enabled === false, '默认 enabled=false');
  assert(s.enabled_at === null, '默认 enabled_at=null');
}

// ==================== 2. enable ====================
section('enable');

{
  const s = enable({ reason: 'test reason' });
  assert(s.enabled === true, 'enable 后 enabled=true');
  assert(typeof s.enabled_at === 'string', 'enable 写入 enabled_at');
  assert(s.reason === 'test reason', 'reason 写入');
  assert(s.enabled_by === 'user', '默认 enabled_by=user');
}

// 状态文件持久化
{
  const s = loadState();
  assert(s.enabled === true, 'loadState 读出 enabled=true');
  assert(s.reason === 'test reason', 'loadState 读出 reason');
}

// ==================== 3. disable ====================
section('disable');

{
  const s = disable();
  assert(s.enabled === false, 'disable 后 enabled=false');
  assert(s.enabled_at === null, 'disable 清空 enabled_at');
  assert(s.reason === null, 'disable 清空 reason');
}

// 验证状态文件也写入了
{
  const s = loadState();
  assert(s.enabled === false, 'loadState 读出 enabled=false');
}

// ==================== 4. toggle ====================
section('toggle');

clearState();
{
  const r1 = toggle();
  assert(r1.action === 'on', '第一次 toggle → on');
  assert(r1.changed === true, 'changed=true');
}

{
  const r2 = toggle();
  assert(r2.action === 'off', '第二次 toggle → off');
}

{
  const r3 = toggle({ reason: 'with reason' });
  assert(r3.action === 'on', '第三次 toggle → on');
  assert(r3.state.reason === 'with reason', 'reason 透传');
}

// ==================== 5. isEnabled ====================
section('isEnabled');

disable();
assert(isEnabled() === false, 'disable 后 isEnabled=false');

enable();
assert(isEnabled() === true, 'enable 后 isEnabled=true');

disable();

// ==================== 6. formatStatusLine ====================
section('formatStatusLine');

{
  clearState();
  const s = formatStatusLine();
  assert(s.includes('正常模式') || s.includes('🙋'), 'OFF 状态显示正常模式', s);
  assert(s.includes('OFF'), 'OFF 状态包含 OFF', s);
}

{
  enable({ reason: 'demo' });
  const s = formatStatusLine();
  assert(s.includes('自主模式') || s.includes('🤖'), 'ON 状态显示自主模式', s);
  assert(s.includes('ON'), 'ON 状态包含 ON', s);
  assert(s.includes('开启于'), 'ON 状态显示开启时间', s);
}

disable();

// ==================== 7. 状态文件位置 ====================
section('状态文件');

{
  enable();
  assert(fs.existsSync(STATE_FILE), '状态文件已生成');
  const content = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  assert(typeof content.enabled === 'boolean', '状态文件含 enabled 字段');
}

// 回归 v2.4.1 bug：路径必须落在工程内 .claude/skills/left-brain/memory/，不要写到上层 H:\AI-han\.claude
{
  const expectedUnder = path.join(__dirname, '..', '..', '.claude', 'skills', 'left-brain', 'memory');
  assert(
    path.dirname(STATE_FILE) === expectedUnder,
    'STATE_FILE 落在工程内 memory 目录',
    `actual=${path.dirname(STATE_FILE)}, expected=${expectedUnder}`
  );
  // 关键反断言：不要写到 H:\AI-han\.claude 或更上层（autonomous.js 旧 bug 是 WORKSPACE_ROOT 多走了一级 ../..）
  const workspaceRoot = path.resolve(__dirname, '..', '..');
  assert(
    STATE_FILE.startsWith(workspaceRoot + path.sep),
    'STATE_FILE 在工程根之内',
    `STATE_FILE=${STATE_FILE}, workspaceRoot=${workspaceRoot}`
  );
  // CLI on 后磁盘文件确实出现在 STATE_FILE 路径（不只是内存可见）
  clearState();
  execFileSync('node', ['autonomous.js', 'on', 'path-bug-regression'], { cwd: __dirname, stdio: 'pipe' });
  assert(fs.existsSync(STATE_FILE), 'CLI on 后 STATE_FILE 实际写到磁盘');
  disable();
}

// ==================== 8. CLI 入口 ====================
section('CLI 入口');

clearState();

// status
{
  const out = execFileSync('node', ['autonomous.js', 'status'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('OFF') || out.includes('正常模式'), 'status 命令显示当前状态');
}

// on
{
  const out = execFileSync('node', ['autonomous.js', 'on', 'test-cli'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('已开启'), 'on 命令输出确认');
  assert(isEnabled() === true, 'on 后状态为 ON');
}

// off
{
  const out = execFileSync('node', ['autonomous.js', 'off'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('正常模式'), 'off 命令输出确认');
  assert(isEnabled() === false, 'off 后状态为 OFF');
}

// toggle
{
  execFileSync('node', ['autonomous.js', 'toggle'], { cwd: __dirname, stdio: 'pipe' });
  assert(isEnabled() === true, 'toggle 后 ON');
  execFileSync('node', ['autonomous.js', 'toggle'], { cwd: __dirname, stdio: 'pipe' });
  assert(isEnabled() === false, '再 toggle 后 OFF');
}

// is-enabled exit code
{
  let code = 0;
  try {
    execFileSync('node', ['autonomous.js', 'is-enabled'], { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  assert(code === 1, 'is-enabled OFF 时 exit 1', `code=${code}`);

  enable();
  code = 0;
  try {
    execFileSync('node', ['autonomous.js', 'is-enabled'], { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  assert(code === 0, 'is-enabled ON 时 exit 0', `code=${code}`);
  disable();
}

// 帮助
{
  const out = execFileSync('node', ['autonomous.js', 'help'], { cwd: __dirname, encoding: 'utf8', stdio: 'pipe' });
  assert(out.includes('autonomous.js v2.0.0'), 'help 显示版本');
  assert(out.includes('on') && out.includes('off'), 'help 列出子命令');
}

// ==================== 9. 永不 throw ====================
section('永不 throw');

// 即使状态文件损坏
{
  fs.writeFileSync(STATE_FILE, '{not valid json');
  let code = 0;
  try {
    execFileSync('node', ['autonomous.js', 'status'], { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    code = e.status;
  }
  assert(code === 0, '损坏 JSON 不崩', `code=${code}`);
  clearState();
}

// ==================== 清理 ====================
clearState();

// ==================== 汇总 ====================
console.log('\n========================================');
console.log(`📊 autonomous 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
console.log('========================================');
if (fail > 0) {
  console.log('\n失败项:');
  for (const f of fails) console.log(`  - ${f.name}${f.detail ? '  → ' + f.detail : ''}`);
}
process.exit(fail > 0 ? 1 : 0);