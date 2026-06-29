#!/usr/bin/env node
/**
 * test-explorer-structure.js — explorer.md 7 段结构验证（M47 子代理标准化）
 *
 * 覆盖：
 *   - 7 段必须齐全：<role> <objective> <execution_context> <context_fidelity>
 *                    <scope_reduction_prohibition> <discovery_levels> <critical_rules>
 *   - frontmatter 必填字段：name / description / model / effort
 *   - 关键约束：禁止 Write/Edit、禁止 spawn 子代理、全局扫描前询问
 *   - 输出格式：3 段（结论 / 证据 / 风险）
 *
 * @since v3.0.5 (2026-06-29) — M47 子代理标准化第 1 阶段（KB-20260629-003 借鉴 GSD）
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const EXPLORER_MD = path.join(__dirname, '..', '..', '.claude', 'agents', 'explorer.md');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}\n   ${e.message}`);
    failed++;
  }
}

// ── 读取 explorer.md ──
const content = fs.readFileSync(EXPLORER_MD, 'utf8');

// ── 1. frontmatter 验证 ──
test('frontmatter 含 name=explorer', () => {
  assert.match(content, /^name:\s*explorer\s*$/m, 'name 必须是 explorer');
});

test('frontmatter 含 description', () => {
  assert.match(content, /^description:\s*.+/m, 'description 不能为空');
});

test('frontmatter 含 model=opus', () => {
  assert.match(content, /^model:\s*opus\s*$/m, 'model 必须是 opus');
});

test('frontmatter 含 effort=low', () => {
  assert.match(content, /^effort:\s*low\s*$/m, 'effort 必须是 low（只读，耗 token 少）');
});

// ── 2. 7 段结构验证（KB-20260629-003 §2 借鉴标准）──
const REQUIRED_SECTIONS = [
  { tag: '<role>', desc: '身份 + 派生关系 + 边界' },
  { tag: '<objective>', desc: '输出格式 + 反面教材' },
  { tag: '<execution_context>', desc: '加载规则 + 可用/禁止工具' },
  { tag: '<context_fidelity>', desc: '锁定决策 + 延后想法 + Claude 自由度' },
  { tag: '<scope_reduction_prohibition>', desc: '严禁简化模式' },
  { tag: '<discovery_levels>', desc: 'L0/L1/L2/L3 4 级发现协议' },
  { tag: '<critical_rules>', desc: '硬规则 + 输出前自检' },
];

REQUIRED_SECTIONS.forEach(({ tag, desc }) => {
  test(`含 7 段之一：${tag}（${desc}）`, () => {
    assert.ok(content.includes(tag), `缺失段落 ${tag}`);
  });
});

// ── 3. 关键约束验证 ──
test('禁止 Write/Edit 工具', () => {
  assert.match(content, /禁止工具[\s\S]*?Write[\s\S]*?Edit/s, '必须在 execution_context 段明列禁止 Write/Edit');
});

test('禁止 spawn 子代理', () => {
  assert.ok(content.includes('不调 spawn 子代理') || content.includes('绝不递归派子代理'),
    '必须显式声明不递归派子代理');
});

test('全局扫描前必须询问（CLAUDE.md 启动协议硬约束）', () => {
  assert.ok(content.includes('全局扫描前必须询问'), '必须引用 CLAUDE.md 启动协议第 6 条');
});

// ── 4. 输出格式验证（3 段：结论 / 证据 / 风险）──
test('输出格式含"结论"', () => {
  assert.ok(content.includes('结论'), 'objective 段必须说明输出含"结论"');
});

test('输出格式含"证据"或"文件路径"', () => {
  assert.ok(content.includes('证据') || content.includes('文件路径'),
    'objective 段必须说明返回文件路径');
});

// ── 5. Discovery Levels 4 级验证 ──
['L0 Skip', 'L1 Quick', 'L2 Standard', 'L3 Deep'].forEach(level => {
  test(`discovery_levels 含 ${level}`, () => {
    assert.ok(content.includes(level), `discovery_levels 段必须含 ${level}`);
  });
});

// ── 6. 行数检查（防止退化）──
const lineCount = content.split('\n').length;
test(`行数 ≥ 80（防退化到原 19 行版本）`, () => {
  assert.ok(lineCount >= 80, `当前 ${lineCount} 行，应 ≥ 80 行`);
});

// ── 输出总结 ──
console.log(`\n📊 ${passed} 通过 / ${failed} 失败（共 ${passed + failed} 项）`);
process.exit(failed > 0 ? 1 : 0);
