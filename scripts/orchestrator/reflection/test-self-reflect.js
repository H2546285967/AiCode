#!/usr/bin/env node
/**
 * self-reflect.js 单元测试
 * 验证 4 个内置规则 + CLI 入口 + JSONL 落盘 + 失败兜底
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  selfReflect,
  parseHookInput,
  checkCodeCompleteness,
  checkTestTrigger,
  checkTodoScan,
  checkDocVersion,
  REFLECTION_FILE,
} = require('./self-reflect');

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

// 测试前清空 reflection 文件
function clearReflection() {
  try { fs.unlinkSync(REFLECTION_FILE); } catch {}
}

// 测试用临时 .js 文件
const TMP_DIR = path.join(__dirname, '__tmp__');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function tmpJs(name, content) {
  const fp = path.join(TMP_DIR, name);
  fs.writeFileSync(fp, content);
  return fp;
}

function cleanup() {
  try {
    fs.readdirSync(TMP_DIR).forEach(f => fs.unlinkSync(path.join(TMP_DIR, f)));
  } catch {}
}

// ==================== 1. 代码完整性规则 ====================
section('规则 1: code-completeness');

// console.log 检测
{
  const r = checkCodeCompleteness('test.js', 'console.log("hello");\nconsole.log("world");');
  assert(r.some(f => f.message.includes('2 处 console.log')), '2 处 console.log 计数');
}

// debugger 检测
{
  const r = checkCodeCompleteness('test.js', 'function f() { debugger; }');
  assert(r.some(f => f.rule === 'code-completeness' && f.severity === 'error'), 'debugger 标 error');
}

// 括号匹配
{
  const r = checkCodeCompleteness('test.js', 'function f() { if (true) { return; ');
  assert(r.some(f => f.message.includes('大括号不匹配')), '大括号不匹配检测');
}

// 干净的代码
{
  const r = checkCodeCompleteness('clean.js', 'function f() { return 1; }');
  assert(r.length === 0, '干净代码 0 反馈');
}

// 非 .js 文件不触发
{
  const r = checkCodeCompleteness('test.md', 'console.log("xxx")');
  assert(r.length === 0, '.md 不触发代码完整性');
}

// ==================== 2. 测试触发规则 ====================
section('规则 2: test-trigger');

// 普通 .js 文件 → 提醒
{
  const r = checkTestTrigger('/path/to/dispatcher.js');
  assert(r.some(f => f.rule === 'test-trigger'), 'dispatcher.js 触发提醒');
  assert(r[0].hint.includes('npm test'), 'hint 提到 npm test');
}

// test-*.js 不提醒
{
  const r = checkTestTrigger('/path/to/test-dispatcher.js');
  assert(r.length === 0, 'test-dispatcher.js 不触发');
}

// index.js 不提醒（基础设施）
{
  const r = checkTestTrigger('/path/to/index.js');
  assert(r.length === 0, 'index.js 不触发');
}

// 非 .js 不触发
{
  const r = checkTestTrigger('/path/to/CLAUDE.md');
  assert(r.length === 0, '.md 不触发测试规则');
}

// ==================== 3. TODO 扫描规则 ====================
section('规则 3: todo-scan');

// 多种标记
{
  const r = checkTodoScan('test.js', '// TODO: 优化\n// FIXME: 修复\n// XXX: 注意\n// HACK: 临时');
  assert(r.some(f => f.message.includes('TODO×1')), 'TODO 计数');
  assert(r.some(f => f.message.includes('FIXME×1')), 'FIXME 计数');
  assert(r.some(f => f.message.includes('XXX×1')), 'XXX 计数');
  assert(r.some(f => f.message.includes('HACK×1')), 'HACK 计数');
}

// 多个 TODO
{
  const r = checkTodoScan('test.js', '// TODO: 1\n// TODO: 2');
  assert(r.some(f => f.message.includes('TODO×2')), 'TODO 计数累加');
}

// 干净代码
{
  const r = checkTodoScan('test.js', 'function f() { return 1; }');
  assert(r.length === 0, '无 TODO 标记 → 0 反馈');
}

// 非 .js 不触发
{
  const r = checkTodoScan('README.md', 'TODO: 文档待完善');
  assert(r.length === 0, '.md 不触发 TODO 扫描');
}

// ==================== 4. 文档版本号规则 ====================
section('规则 4: doc-version');

// 包含过时版本
{
  const r = checkDocVersion('test.md', '这个功能在 v1.0 引入');
  assert(r.some(f => f.message.includes('v1.0')), 'v1.0 被检测');
}

// 不包含过时版本
{
  const r = checkDocVersion('test.md', '当前版本 v1.9.1');
  assert(r.length === 0, 'v1.9.1 不被标 stale');
}

// 多个过时版本
{
  const r = checkDocVersion('test.md', 'v1.0 之后是 v1.5');
  assert(r.length === 2, '两个过时版本都检测', `found=${r.length}`);
}

// 边界：JS \b 不识别 .，v1.0.0 中 v1.0 仍匹配词边界（这是预期行为）
{
  const r = checkDocVersion('test.md', 'this is v1.0.0');
  assert(r.some(f => f.message.includes('v1.0')), 'JS \b 不识别 .，v1.0.0 也会匹配 v1.0（已知行为）');
}

// 非 .md 不触发
{
  const r = checkDocVersion('test.js', '// v1.0');
  assert(r.length === 0, '.js 不触发文档版本规则');
}

// ==================== 5. selfReflect 集成 ====================
section('selfReflect 集成（多规则）');

clearReflection();

// 综合触发：改一个有 console.log + TODO + debugger 的非 test js 文件
{
  const fp = tmpJs('sample.js', `
    console.log('debug');
    // TODO: 优化
    function f() {
      if (true) {
        debugger;
        return 1;
  `);  // 注意：最后少一个 }，触发括号不匹配

  const findings = selfReflect('Write', fp, fs.readFileSync(fp, 'utf8'));

  assert(findings.length >= 3, '至少 3 项反馈（console+todo+braces+test）', `found=${findings.length}`);
  assert(findings.some(f => f.rule === 'code-completeness'), '包含 code-completeness');
  assert(findings.some(f => f.rule === 'todo-scan'), '包含 todo-scan');
  assert(findings.some(f => f.rule === 'test-trigger'), '包含 test-trigger');
}

// JSONL 落盘验证
{
  assert(fs.existsSync(REFLECTION_FILE), 'reflection 文件已生成');
  const lines = fs.readFileSync(REFLECTION_FILE, 'utf8').trim().split('\n').filter(Boolean);
  assert(lines.length >= 3, '至少 3 条记录', `lines=${lines.length}`);
  const last = JSON.parse(lines[lines.length - 1]);
  assert(typeof last.timestamp === 'string', '记录含 timestamp');
  assert(typeof last.rule === 'string', '记录含 rule');
  assert(typeof last.file_path === 'string', '记录含 file_path');
}

// 去重验证：再跑一次相同文件相同内容
{
  const fp = tmpJs('sample.js', `
    console.log('debug');
    // TODO: 优化
  `);
  const before = fs.readFileSync(REFLECTION_FILE, 'utf8').trim().split('\n').filter(Boolean).length;
  selfReflect('Write', fp, fs.readFileSync(fp, 'utf8'));
  const after = fs.readFileSync(REFLECTION_FILE, 'utf8').trim().split('\n').filter(Boolean).length;
  assert(after === before, '去重生效：相同内容不重复', `before=${before} after=${after}`);
}

// Edit/Write 之外不触发
{
  clearReflection();
  const findings = selfReflect('Read', '/tmp/test.js', 'console.log()');
  assert(findings.length === 0, 'Read 不触发');
  assert(!fs.existsSync(REFLECTION_FILE) || fs.readFileSync(REFLECTION_FILE, 'utf8').trim() === '', 'Read 无写入');
}

// 无 file_path 不崩
{
  const findings = selfReflect('Write', null, 'console.log()');
  assert(findings.length === 0, 'null file_path 返回空');
}

// ==================== 6. CLI 入口 ====================
section('CLI 入口');

// 正常 JSON 输入
{
  const input = JSON.stringify({
    tool_use_name: 'Write',
    file_path: tmpJs('cli-test.js', 'console.log("test");\n// TODO'),
  });
  clearReflection();
  const out = execFileSync('node', ['self-reflect.js', input], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('反馈已记录'), 'CLI 输出反馈', `out=${out.slice(0, 100)}`);
}

// 非 Edit/Write 不输出
{
  const input = JSON.stringify({ tool_use_name: 'Read', file_path: '/tmp/x.js' });
  const out = execFileSync('node', ['self-reflect.js', input], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(!out.includes('反馈已记录'), 'Read 不输出反馈');
}

// 非法 JSON 不崩（exit 0）
{
  let code = 0;
  try {
    execFileSync('node', ['self-reflect.js', 'not json'], {
      cwd: __dirname, stdio: 'pipe',
    });
  } catch (e) {
    code = e.status;
  }
  assert(code === 0, '非法 JSON exit 0（不阻塞主流程）', `code=${code}`);
}

// ==================== 7. parseHookInput 单元测试（M54-A 修复） ====================
section('parseHookInput：PostToolUse 嵌套 + 扁平双结构');

// 真实 PostToolUse 嵌套结构
{
  const r = parseHookInput(JSON.stringify({
    tool_use_name: 'Write',
    tool_input: { file_path: '/p/a.js', new_content: 'console.log(1);' },
  }));
  assert(r.toolName === 'Write', '嵌套：toolName 解析', `got=${r.toolName}`);
  assert(r.filePath === '/p/a.js', '嵌套：file_path 解析', `got=${r.filePath}`);
  assert(r.content === 'console.log(1);', '嵌套：new_content 解析', `got=${r.content}`);
}

// 真实 Edit 工具
{
  const r = parseHookInput(JSON.stringify({
    tool_use_name: 'Edit',
    tool_input: {
      file_path: '/p/b.js',
      old_content: 'var x = 1;',
      new_content: 'const x = 1;',
    },
  }));
  assert(r.toolName === 'Edit', 'Edit: toolName', `got=${r.toolName}`);
  assert(r.filePath === '/p/b.js', 'Edit: file_path', `got=${r.filePath}`);
  assert(r.content === 'const x = 1;', 'Edit: 优先取 new_content', `got=${r.content}`);
}

// 扁平结构（向后兼容）
{
  const r = parseHookInput(JSON.stringify({
    tool_use_name: 'Write',
    file_path: '/p/c.js',
    content: '// TODO',
  }));
  assert(r.toolName === 'Write', '扁平：toolName');
  assert(r.filePath === '/p/c.js', '扁平：file_path');
  assert(r.content === '// TODO', '扁平：content');
}

// 非法 JSON
{
  const r = parseHookInput('not json');
  assert(r.toolName === null && r.filePath === null && r.content === null,
    '非法 JSON 全 null');
}

// 空 / 非字符串
{
  assert(parseHookInput(null).filePath === null, 'null 输入');
  assert(parseHookInput('').filePath === null, '空字符串');
  assert(parseHookInput(123).filePath === null, '非字符串输入');
  assert(parseHookInput('{"tool_use_name":"Write"}').filePath === null,
    '无 tool_input/file_path 时为 null');
}

// CLI 端到端：嵌套结构能写入 JSONL
{
  const fp = tmpJs('nested-test.js', 'console.log("nested");');
  const input = JSON.stringify({
    tool_use_name: 'Write',
    tool_input: { file_path: fp, new_content: 'console.log("nested");' },
  });
  clearReflection();
  const out = execFileSync('node', ['self-reflect.js', input], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(out.includes('反馈已记录'), '嵌套结构 CLI 触发反馈', `out=${out.slice(0, 100)}`);
  const lines = fs.readFileSync(REFLECTION_FILE, 'utf8').trim().split('\n').filter(Boolean);
  assert(lines.length >= 1, '嵌套结构 JSONL 写入', `lines=${lines.length}`);
}

// CLI 端到端：Edit 工具不输出
{
  const input = JSON.stringify({
    tool_use_name: 'Read',
    tool_input: { file_path: '/tmp/x.js' },
  });
  const out = execFileSync('node', ['self-reflect.js', input], {
    cwd: __dirname, encoding: 'utf8', stdio: 'pipe',
  });
  assert(!out.includes('反馈已记录'), '嵌套结构 Read 不输出');
}

// ==================== 清理 ====================
cleanup();
clearReflection();

// ==================== 汇总 ====================
console.log('\n========================================');
console.log(`📊 self-reflect 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
console.log('========================================');
if (fail > 0) {
  console.log('\n失败项:');
  for (const f of fails) console.log(`  - ${f.name}${f.detail ? '  → ' + f.detail : ''}`);
}
process.exit(fail > 0 ? 1 : 0);
