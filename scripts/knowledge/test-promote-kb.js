#!/usr/bin/env node
/**
 * test-promote-kb.js — promote-kb 单元测试（M48-A）
 *
 * 覆盖：
 *   1. parseKB 解析 frontmatter（4 字段：title/category/created/tags）
 *   2. ageInDays 日期差计算
 *   3. judgePromote 4 路径：
 *      a. 常驻类（偏好/reference）→ 跳过
 *      b. 触发 1：主题反复 ≥ 3 次
 *      c. 触发 2：技术/概念类
 *      d. 触发 3：事件类 > 14 天
 *      e. 不触发：事件类 < 14 天
 *   4. buildRepeatMap 计数
 *   5. listAllKBs 列出目录
 *   6. CLI --report 输出包含建议条数
 *   7. CLI --dry-run 不写文件（默认 safe）
 *
 * 用法：node test-promote-kb.js
 * 退出：0 = 全过，非 0 = 失败
 *
 * @since v3.0.6 (2026-06-29)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const promote = require('./promote-kb.js');

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${name}\n     ${e.message}`);
    fail++;
    failures.push({ name, error: e.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'assertEq'} — 期望 ${JSON.stringify(b)} 实际 ${JSON.stringify(a)}`);
}

function makeTempKB(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'promote-test-'));
  const file = path.join(dir, 'test-kb.md');
  fs.writeFileSync(file, content);
  return { dir, file };
}

// ── 测试 ──────────────────────────────────────────────

console.log('\n🧪 test-promote-kb.js\n');

test('parseKB 解析完整 frontmatter', () => {
  const kb = promote.parseKB = promote.parseKB;
  const { file } = makeTempKB(`---
title: 测试 KB
category: 决策
created: 2026-06-01
tags: [a, b]
---

# 标题

这是一段正文。`);
  // 用 require 暴露的 parseKB（避免循环）
  const { parseKB } = require('./promote-kb.js');
  const parsed = parseKB(file);
  assertEq(parsed.title, '测试 KB', 'title');
  assertEq(parsed.category, '决策', 'category');
  assertEq(parsed.created, '2026-06-01', 'created');
  assertEq(parsed.tags.length, 2, 'tags length');
  assert(parsed.content.includes('# 标题'), 'content 含标题');
});

test('ageInDays 计算', () => {
  const { ageInDays } = require('./promote-kb.js');
  const days = ageInDays('2026-06-20');
  // 今天是 2026-06-29，应该 = 9
  if (days < 8 || days > 10) throw new Error(`期望 9，实际 ${days}`);
});

test('ageInDays 无效日期返回 0', () => {
  const { ageInDays } = require('./promote-kb.js');
  assertEq(ageInDays(''), 0, '空');
  assertEq(ageInDays('invalid'), 0, '无效');
});

test('judgePromote 常驻类（偏好）跳过', () => {
  const { judgePromote, buildRepeatMap } = require('./promote-kb.js');
  const kb = { title: 'X', category: '偏好', created: '2026-06-01' };
  const r = judgePromote(kb, new Map());
  assert(!r.shouldPromote, '偏好应跳过');
  assert(r.reason.includes('常驻'), 'reason 提常驻');
});

test('judgePromote 触发 1: 主题反复 ≥ 3', () => {
  const { judgePromote, buildRepeatMap } = require('./promote-kb.js');
  const kb = { title: 'autonomous-mode 配置', category: '事件', created: '2026-06-29' };
  const map = new Map();
  // 'autonomous-mode' → 'auto' (前 4 字符)
  map.set('auto', 3);
  const r = judgePromote(kb, map);
  assert(r.shouldPromote, '应触发');
  assert(r.reason.includes('触发 1'), 'reason 提触发 1');
});

test('judgePromote 触发 1: KB-YYYYMMDD 文件名不聚合', () => {
  const { judgePromote } = require('./promote-kb.js');
  const kb = { title: 'KB-20260621-005', category: '事件', created: '2026-06-29' };
  const map = new Map();
  map.set('KB-2', 74);  // 错误示例：旧算法聚合
  const r = judgePromote(kb, map);
  assert(!r.shouldPromote, '文件名 style 不应聚合触发');
});

test('judgePromote 触发 2: 技术类', () => {
  const { judgePromote } = require('./promote-kb.js');
  const kb = { title: 'Spring Boot 3 配置', category: '技术', created: '2026-06-29' };
  const r = judgePromote(kb, new Map());
  assert(r.shouldPromote, '技术类应触发');
  assert(r.reason.includes('触发 2'), 'reason 提触发 2');
});

test('judgePromote 触发 2: 概念澄清类', () => {
  const { judgePromote } = require('./promote-kb.js');
  const kb = { title: 'RAG 是什么', category: '概念澄清', created: '2026-06-29' };
  const r = judgePromote(kb, new Map());
  assert(r.shouldPromote, '概念澄清应触发');
});

test('judgePromote 触发 3: 事件类 > 14 天', () => {
  const { judgePromote } = require('./promote-kb.js');
  const kb = { title: 'X 完成了', category: '事件', created: '2026-06-01' };
  const r = judgePromote(kb, new Map());
  assert(r.shouldPromote, '28 天前事件应触发');
  assert(r.reason.includes('触发 3'), 'reason 提触发 3');
});

test('judgePromote 事件类 < 14 天不触发', () => {
  const { judgePromote } = require('./promote-kb.js');
  const kb = { title: 'X 完成了', category: '事件', created: '2026-06-25' };
  const r = judgePromote(kb, new Map());
  assert(!r.shouldPromote, '4 天前事件不触发');
});

test('buildRepeatMap 统计主题', () => {
  const { buildRepeatMap } = require('./promote-kb.js');
  const kbs = [
    { title: 'autonomous-mode 开' },
    { title: 'autonomous-mode 关' },
    { title: 'autonomous-mode 切换' },
  ];
  const m = buildRepeatMap(kbs);
  // 'autonomous-mode' → 第一个 ≥4 字符英文 = 'autonomous' → slice(0,4) = 'auto'
  assertEq(m.get('auto'), 3, 'auto 计数');
});

test('buildRepeatMap KB-YYYYMMDD-NNN 文件名不算主题', () => {
  const { buildRepeatMap } = require('./promote-kb.js');
  const kbs = [
    { title: 'KB-20260621-001' },
    { title: 'KB-20260621-002' },
    { title: 'KB-20260621-003' },
  ];
  const m = buildRepeatMap(kbs);
  // 文件名前缀被剥掉，不产生聚合 key
  assertEq(m.size, 0, 'KB-YYYYMMDD-NNN 不应聚合');
});

test('PROMOTE_CONFIG 阈值正确', () => {
  assertEq(promote.PROMOTE_CONFIG.repeatCountThreshold, 3, 'repeatCount');
  assertEq(promote.PROMOTE_CONFIG.eventAgeDays, 14, 'eventAge');
  assert(promote.PROMOTE_CONFIG.evergreenCategories.includes('偏好'), '含偏好');
});

test('CLI --report 输出含统计', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'promote-kb.js'), '--report'], { encoding: 'utf8' });
  assert(r.status === 0, `exit=${r.status}`);
  assert(r.stdout.includes('KB 毕业体检报告'), '报告标题');
  assert(/总计: \d+ 条 KB/.test(r.stdout), '总计行');
});

test('CLI --dry-run 不写文件', () => {
  const { spawnSync } = require('child_process');
  // 测：跑 --dry-run 看输出包含 "DRY-RUN" + 计数
  const r = spawnSync('node', [path.join(__dirname, 'promote-kb.js'), '--dry-run'], { encoding: 'utf8' });
  assert(r.status === 0, `exit=${r.status}`);
  assert(r.stdout.includes('DRY-RUN') || r.stdout.includes('dry-run'), 'DRY-RUN 标识');
  assert(r.stdout.includes('将对'), '动作计数');
});

test('CLI 无参数 = --report（默认）', () => {
  const { spawnSync } = require('child_process');
  const r = spawnSync('node', [path.join(__dirname, 'promote-kb.js')], { encoding: 'utf8' });
  assert(r.status === 0, `exit=${r.status}`);
  assert(r.stdout.includes('KB 毕业体检报告'), '默认是 report');
});

test('listAllKBs 列出真实 KB 目录', () => {
  const { listAllKBs } = require('./promote-kb.js');
  const all = listAllKBs();
  assert(Array.isArray(all), '返回数组');
  assert(all.length > 0, `KB 目录应有内容，实际 ${all.length} 条`);
  // 至少含 1 条标准 frontmatter
  const withFm = all.filter(k => k.category && k.category !== 'unknown');
  assert(withFm.length > 0, `至少 1 条有 category，实际 ${withFm.length}/${all.length}`);
});

// ── 总结 ──────────────────────────────────────────────

console.log(`\n${'='.repeat(50)}`);
console.log(`总计: ${pass + fail} · 通过: ${pass} · 失败: ${fail}`);
if (fail > 0) {
  console.log(`\n失败用例:`);
  for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
  process.exit(1);
} else {
  console.log('✅ 全部通过\n');
  process.exit(0);
}
