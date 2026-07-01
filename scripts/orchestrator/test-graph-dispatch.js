#!/usr/bin/env node
/**
 * M14 知识图谱反哺调度单元测试（v3.0.0）
 *
 * 覆盖：
 *   1. recallBeforeDispatch 边界（null/空字符串/非字符串）
 *   2. recallBeforeDispatch 完全未知 → hit='miss'
 *   3. recallBeforeDispatch 命中复用 → hit='reuse', matched=true
 *   4. decide() 返回 graph 字段（任何路径）
 *   5. decide() + M14 hit='reuse' → 强制 dispatch=false + reuse_kb
 *   6. decide() + M14 hit='miss'/'no-graph' → 原逻辑不变
 *   7. GRAPH_RECALL_THRESHOLDS 阈值常量正确导出
 *   8. 软引用：semantic-recall 引擎不存在时降级为 no-graph
 *   9. evo.kb.recall 评价事件被记录
 *
 * @since v3.0.0 (2026-06-25) M14
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');

// 准备：清理 metrics.jsonl（M14 测试会写 evo 事件）
const Metrics = require('./metrics');
try { fs.unlinkSync(Metrics.METRICS_FILE); } catch { /* ok */ }

const dispatcher = require('./dispatcher');
const {
  decide,
  recallBeforeDispatch,
  GRAPH_RECALL_THRESHOLDS,
  REUSE_CONFIDENCE_MIN,
  REUSE_CATEGORIES,
  RULES,
} = dispatcher;

let pass = 0, fail = 0;
const fails = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}${detail ? '  → ' + detail : ''}`); fails.push(name); }
}

// ==================== 1. 边界 ====================
console.log('── 1. 边界条件 ──');

{
  const r1 = recallBeforeDispatch(null);
  check('null 输入 → hit=miss', r1.hit === 'miss' && !r1.matched);

  const r2 = recallBeforeDispatch('');
  check('空字符串 → hit=miss', r2.hit === 'miss' && !r2.matched);

  const r3 = recallBeforeDispatch(123);
  check('非字符串 → hit=miss', r3.hit === 'miss' && !r3.matched);
}

// ==================== 2. 常量导出 ====================
console.log('\n── 2. GRAPH_RECALL_THRESHOLDS 常量 ──');

check('reuse 阈值 = 0.5', GRAPH_RECALL_THRESHOLDS.reuse === 0.5);
check('similar 阈值 = 0.05', GRAPH_RECALL_THRESHOLDS.similar === 0.05);
check('RULES.version = 3.0.0', RULES.version === '3.0.0');

// ==================== 3. 完全未知 query（用随机字符串避开 KB） ====================
console.log('\n── 3. 完全未知 query ──');

{
  // 真 KB 内容（来自 .claude/skills/left-brain/memory/knowledge/KB-*.md），
  // 用完全不沾边的随机字符串触发 miss（已用 semantic-recall 验证返回 null）
  const r = recallBeforeDispatch('zzqqxxww uvwxyzpqrst qwertyuiop完全');
  check('完全未知 → hit=miss', r.hit === 'miss');
  check('完全未知 → matched=false', !r.matched);
  check('完全未知 → kb=null', r.kb === null);
  check('完全未知 → score=0', r.score === 0);
  check('完全未知 → threshold 字段存在', r.threshold && r.threshold.reuse === 0.5);
}

// ==================== 4. 命中复用 query（用真实 KB 内容） ====================
console.log('\n── 4. 命中复用 query ──');

{
  // 真实 KB 里有 "左脑系统已安装成功" 这种高频词
  const r = recallBeforeDispatch('左脑系统已安装成功版本自动记忆语义搜索');
  // 可能命中 reuse 或 similar（取决于相似度）
  check('真实 KB 相关 query → matched=true', r.matched === true);
  check('真实 KB 相关 query → hit ∈ {reuse, similar}', r.hit === 'reuse' || r.hit === 'similar');
  check('真实 KB 相关 query → kb 非空', r.kb !== null);
  check('真实 KB 相关 query → kb.id 以 KB- 开头', r.kb && r.kb.id && r.kb.id.startsWith('KB-'));
  check('真实 KB 相关 query → score > 0', r.score > 0);
}

// ==================== 5. decide() 返回 graph 字段 ====================
console.log('\n── 5. decide() 集成 graph 字段 ──');

{
  const r1 = decide('快速看下 dispatcher 是什么');
  check('decide() 返回 graph 字段', r1.graph !== undefined);
  check('decide() 返回 graph.matched 是 bool', typeof r1.graph.matched === 'boolean');
  check('decide() 返回 graph.hit 是 string', typeof r1.graph.hit === 'string');
}

{
  const r2 = decide('请帮我推荐一个 JS 框架');
  check('recommend query → graph 字段存在', r2.graph !== undefined);
  check('recommend query → dispatch=false', r2.dispatch === false);
}

// ==================== 6. M14 hit=reuse 强制 dispatch=false ====================
console.log('\n── 6. M14 hit=reuse 强制不派 ──');

{
  // 找一个高分 query（如果 KB 里有"安装成功 版本 自动记忆"等）
  // 用最可能的 KB 内容 query
  let reusedFound = false;
  const candidates = [
    '左脑系统已安装成功版本自动记忆和语义搜索',
    '左脑系统已安装成功',
    'M13 失败蒸馏器',
    'M14 知识图谱',
    'M15 效果量化指标',
    'dispatcher 派 Agent',
    'auto-implement LLM-judge',
  ];
  for (const q of candidates) {
    const g = recallBeforeDispatch(q);
    if (g.hit === 'reuse') {
      reusedFound = true;
      const r = decide(q);
      check('M14 hit=reuse → decide dispatch=false', r.dispatch === false);
      check('M14 hit=reuse → decide reuse_kb 字段', r.reuse_kb !== undefined);
      check('M14 hit=reuse → reuse_kb.id 以 KB- 开头', r.reuse_kb && r.reuse_kb.id.startsWith('KB-'));
      check('M14 hit=reuse → reason 含 KB id', r.reason.includes(r.reuse_kb.id));
      check('M14 hit=reuse → reason 含 "知识图谱命中复用"', r.reason.includes('知识图谱命中复用'));
      break;
    }
  }
  if (!reusedFound) {
    // 跳过此组（KB 没达到 0.5 阈值）——记为信息性 PASS（不计入 fail）
    console.log('ℹ️  跳过 M14 reuse 集成测试（KB 当前无 ≥0.5 命中）');
  }
}

// ==================== 6.5 M14 reuse confidence / category 过滤（mock semantic-recall）====================
console.log('\n── 6.5 M14 reuse confidence + category 过滤 ──');

{
  const SR_PATH = require.resolve('./recall/semantic-recall');
  const savedSR = require.cache[SR_PATH];

  function mockSR(kb) {
    require.cache[SR_PATH] = {
      id: SR_PATH,
      filename: SR_PATH,
      loaded: true,
      exports: {
        search: () => [kb],
      },
    };
    delete require.cache[require.resolve('./dispatcher')];
    return require('./dispatcher');
  }

  function restoreSR() {
    require.cache[SR_PATH] = savedSR;
    delete require.cache[require.resolve('./dispatcher')];
  }

  // 1) 高分 + 高 confidence + 可信类别 → reuse
  {
    const D = mockSR({ id: 'KB-TEST-001', category: '决策', content: '测试', score: 0.95, confidence: 0.9 });
    const g = D.recallBeforeDispatch('任意查询');
    check('高分+高置信+可信类别 → hit=reuse', g.hit === 'reuse', `实际=${g.hit}`);
    check('reuse 时 confidence 字段回传', g.confidence === 0.9);
    restoreSR();
  }

  // 2) 高分 + 低 confidence → similar（不被误复用）
  {
    const D = mockSR({ id: 'KB-TEST-002', category: '决策', content: '测试', score: 0.95, confidence: 0.3 });
    const g = D.recallBeforeDispatch('任意查询');
    check('高分+低置信 → hit=similar（不被误复用）', g.hit === 'similar', `实际=${g.hit}`);
    restoreSR();
  }

  // 3) 高分 + 高 confidence + 不可信类别 → similar
  {
    const D = mockSR({ id: 'KB-TEST-003', category: '偏好', content: '测试', score: 0.95, confidence: 0.9 });
    const g = D.recallBeforeDispatch('任意查询');
    check('高分+高置信+不可信类别 → hit=similar', g.hit === 'similar', `实际=${g.hit}`);
    restoreSR();
  }

  // 4) 边界：confidence 恰好等于阈值 → reuse
  {
    const D = mockSR({ id: 'KB-TEST-004', category: '技术', content: '测试', score: 0.6, confidence: REUSE_CONFIDENCE_MIN });
    const g = D.recallBeforeDispatch('任意查询');
    check('confidence 恰好等于阈值 → reuse', g.hit === 'reuse', `实际=${g.hit}`);
    restoreSR();
  }
}

// ==================== 7. M14 hit=miss/no-graph → 原逻辑不变 ====================
console.log('\n── 7. M14 hit=miss 原逻辑不变 ──');

{
  const r = decide('zzqqxxww uvwxyzpqrst qwertyuiop完全');
  check('完全未知 query → 走原 dispatcher 逻辑', r.graph.hit === 'miss');
  check('完全未知 query → 原字段 complexity_score 仍存在', typeof r.complexity_score === 'number');
  check('完全未知 query → 原字段 complexity_band 仍存在', typeof r.complexity_band === 'string');
}

// ==================== 8. 软引用：semantic-recall 不可用时降级 ====================
console.log('\n── 8. 软引用降级 no-graph ──');

// 用 Module._cache hack 模拟 semantic-recall 不可用
const SR_PATH = require.resolve('./recall/semantic-recall');
const savedSR = require.cache[SR_PATH];

// 暂时删除模块缓存 + hack require 让 recall 抛错
require.cache[SR_PATH] = {
  id: SR_PATH,
  filename: SR_PATH,
  loaded: true,
  exports: null,  // 模拟 require 后 exports 为 null
};

delete require.cache[require.resolve('./dispatcher')];
const D2 = require('./dispatcher');
const r = D2.recallBeforeDispatch('左脑系统已安装成功版本自动记忆和语义搜索');
check('semantic-recall exports=null → hit=no-graph', r.hit === 'no-graph');
check('no-graph → matched=false', !r.matched);
check('no-graph → 不抛异常', true);

// 恢复缓存
require.cache[SR_PATH] = savedSR;
delete require.cache[require.resolve('./dispatcher')];

// ==================== 9. evo.kb.recall 评价事件已记录 ====================
console.log('\n── 9. evo.kb.recall 评价事件 ──');

// 上面的测试应该已记录了多条 recall 事件
const lines = fs.readFileSync(Metrics.METRICS_FILE, 'utf8').split('\n').filter(Boolean);
const evoKbLines = lines.map(l => JSON.parse(l)).filter(e => e.name && (e.name === 'evo.kb.recall.hit' || e.name === 'evo.kb.recall.miss'));

check('evo.kb.recall.* 事件被记录（≥3 条）', evoKbLines.length >= 3);
const sourceLines = evoKbLines.filter(e => e.tags && e.tags.source === 'dispatcher');
check('source=dispatcher 事件存在', sourceLines.length >= 1);
const subTags = new Set(sourceLines.map(e => e.tags.hit).filter(Boolean));
check('subtag 含 miss', subTags.has('miss'));

// ==================== 总结 ====================
console.log('');
console.log(`📊 M14 dispatcher 测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
if (fail > 0) {
  console.log('失败项:');
  fails.forEach(f => console.log(`  - ${f}`));
}
process.exit(fail > 0 ? 1 : 0);