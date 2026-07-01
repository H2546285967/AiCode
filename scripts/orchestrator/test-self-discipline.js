#!/usr/bin/env node
/**
 * test-self-discipline.js — self-discipline 6 步法决策树校验（v6 · Karpathy）
 *
 * 覆盖：
 *   1. self-discipline.md 存在 + 是 6 步法（标题 + 表格 + footer）
 *   2. first-principles.md 存在 + 含关键概念（编码前思考 + 第一性原理 + 4 类反模式 + 5 类审查角度）
 *   3. behavior.md 含 Karpathy 简洁优先 / 精准修改
 *   4. 决策树 0.5 步存在（编码前思考 + 第一性原理 + 对抗式审查）
 *   5. CLAUDE.md / 01.md / 02.md 提及 Karpathy 4 原则
 *   6. 04.md §0.4 M52/M63 段存在 + §十二对应行存在
 *   7. CHANGELOG Unreleased 段含 Karpathy 条目
 *
 * @since v6 Karpathy (2026-07-01)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const RULES_DIR = path.join(ROOT, '.claude', 'rules');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const ROADMAP = path.join(ROOT, '04_自我演进路线.md');
const DOC_01 = path.join(ROOT, '01_AI-ClaudeCode-最佳实践精简.md');
const DOC_02 = path.join(ROOT, '02_工作空间功能介绍.md');

let pass = 0, fail = 0;
const fails = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; fails.push(name); console.log(`❌ ${name}${detail ? '  → ' + detail : ''}`); }
}

console.log('── 1. self-discipline.md 6 步法校验（v6 Karpathy）──');

const selfDiscipline = path.join(RULES_DIR, 'self-discipline.md');
check('self-discipline.md 存在', fs.existsSync(selfDiscipline));
if (fs.existsSync(selfDiscipline)) {
  const txt = fs.readFileSync(selfDiscipline, 'utf8');
  check('标题包含 "6 步法"', /6 步法/.test(txt));
  check('标题包含 "Karpathy"', /Karpathy/.test(txt));
  check('表格含 0.5 步 / 零点五 思维闸门', /零点五|0\.5.*思维闸门/.test(txt));
  check('含 "编码前思考"', /编码前思考/.test(txt));
  check('含 "第一性原理"', /第一性原理/.test(txt));
  check('含 "对抗式审查"', /对抗式审查/.test(txt));
  check('含 "简洁优先"', /简洁优先/.test(txt));
  check('含 "精准修改"', /精准修改/.test(txt));
  check('含 "目标驱动执行"', /目标驱动执行/.test(txt));
  check('含 "first-principles.md" 关联', /first-principles\.md/.test(txt));
  check('含 "behavior.md" 关联', /behavior\.md/.test(txt));
}

console.log('\n── 2. first-principles.md 校验 ──');

const fp = path.join(RULES_DIR, 'first-principles.md');
check('first-principles.md 存在', fs.existsSync(fp));
if (fs.existsSync(fp)) {
  const txt = fs.readFileSync(fp, 'utf8');
  check('含 "编码前思考"', /编码前思考/.test(txt));
  check('含 "第一性原理"', /第一性原理/.test(txt));
  check('含 "对抗式审查"', /对抗式审查/.test(txt));
  check('含 4 类反模式（行业共识/中间层/模仿/跳过根因）', /行业共识|加中间层|模仿 trending|跳过根因/.test(txt));
  check('含 5 类审查角度（输入异常/边界/并发/时间/部署）', /输入异常|边界条件|并发|时间污染|部署.*回滚/.test(txt));
  check('含 Karpathy 来源', /Karpathy/.test(txt));
}

console.log('\n── 3. behavior.md 校验 ──');

const behavior = path.join(RULES_DIR, 'behavior.md');
check('behavior.md 存在', fs.existsSync(behavior));
if (fs.existsSync(behavior)) {
  const txt = fs.readFileSync(behavior, 'utf8');
  check('behavior.md 含 "简洁优先"', /简洁优先/.test(txt));
  check('behavior.md 含 "精准修改"', /精准修改/.test(txt));
  check('behavior.md 含 "每一行修改"', /每一行修改/.test(txt));
}

console.log('\n── 4. CLAUDE.md / 01.md / 02.md 提及 Karpathy 4 原则 ──');

if (fs.existsSync(CLAUDE_MD)) {
  const txt = fs.readFileSync(CLAUDE_MD, 'utf8');
  check('CLAUDE.md 含 "编码前思考" 或 "简洁优先" 或 "精准修改" 或 "目标驱动"',
    /编码前思考|简洁优先|精准修改|目标驱动/.test(txt));
}

if (fs.existsSync(DOC_01)) {
  const txt = fs.readFileSync(DOC_01, 'utf8');
  check('01.md 含 Karpathy 4 原则任一', /编码前思考|简洁优先|精准修改|目标驱动/.test(txt));
}
if (fs.existsSync(DOC_02)) {
  const txt = fs.readFileSync(DOC_02, 'utf8');
  check('02.md 含 Karpathy 4 原则任一', /编码前思考|简洁优先|精准修改|目标驱动/.test(txt));
}

console.log('\n── 5. 04.md §0.4 M63 + §十二 ──');

if (fs.existsSync(ROADMAP)) {
  const txt = fs.readFileSync(ROADMAP, 'utf8');
  check('04.md 含 M63/Karpathy 段', /增量 M63|Karpathy/.test(txt));
  check('04.md §十二含 M63 行', /\| \*\*M63\*\* \|/.test(txt));
}

console.log('\n── 6. CHANGELOG Unreleased Karpathy ──');

if (fs.existsSync(CHANGELOG)) {
  const txt = fs.readFileSync(CHANGELOG, 'utf8');
  const unreleasedMatch = txt.match(/## \[Unreleased\][\s\S]*?(?=\n## \[v|\n---)/);
  const ur = unreleasedMatch ? unreleasedMatch[0] : '';
  check('CHANGELOG Unreleased 含 Karpathy', /Karpathy|编码前思考|简洁优先|精准修改|目标驱动/.test(ur));
}

console.log('');
console.log(`📊 self-discipline v6 Karpathy 校验: ${pass}/${pass + fail} 通过, ${fail} 失败`);
if (fail > 0) {
  console.log('失败项:');
  fails.forEach(f => console.log(`  - ${f}`));
}
process.exit(fail > 0 ? 1 : 0);