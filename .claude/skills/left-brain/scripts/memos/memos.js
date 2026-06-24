#!/usr/bin/env node
/**
 * MemOS - Self-Evolving Memory OS（左脑本地化版）
 * 借鉴 MemTensor/MemOS（GitHub ⭐9974）核心思想，本地无依赖实现
 *
 * 核心能力（4 个）：
 * 1. tiered-memory:  记忆分级（hot/warm/cold）按 access_count + last_accessed 自动分层
 * 2. hybrid-retrieve: 混合检索（关键词 + 字面相似度 + 图谱）
 * 3. self-evolve:    自我进化（每日扫描，热度晋升 / 过期降级）
 * 4. skill-reuse:    跨任务复用（KB 字段直接供 session-init 消费）
 *
 * @since v1.9.1 (2026-06-24)
 * @source https://github.com/MemTensor/MemOS (composite_score 7.95)
 */

const fs = require('fs');
const path = require('path');

// ── 路径配置 ─────────────────────────────────────────

// memos.js 所在: .../left-brain/scripts/memos/memos.js
// SKILL_DIR:     .../left-brain/（向上 2 层：memos → scripts）
// MEMORY_DIR:    .../left-brain/memory/
const SKILL_DIR = path.join(__dirname, '..', '..');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');
const KNOWLEDGE_DIR = path.join(MEMORY_DIR, 'knowledge');
const ASSOCIATIONS_DIR = path.join(MEMORY_DIR, 'associations');
const LOGS_DIR = path.join(MEMORY_DIR, 'logs');

// 状态文件
const TIER_STATE_FILE = path.join(MEMORY_DIR, 'memos-tier.json');
const EVOLUTION_LOG_FILE = path.join(LOGS_DIR, 'memos-evolution.jsonl');

// ── 分级阈值（可调）─────────────────────────────────

const TIER_THRESHOLDS = {
  // 热度：access_count >= hot_min → hot
  hot_min: 5,
  // 温：access_count >= warm_min → warm
  warm_min: 2,
  // 冷：access_count < warm_min → cold
  // 过期：last_accessed 超过 cold_max_age_days 天 → cold
  cold_max_age_days: 60,
};

// ── 工具函数 ─────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadKBFiles() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return [];
  return fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fp = path.join(KNOWLEDGE_DIR, f);
      const content = fs.readFileSync(fp, 'utf8');
      return { file: f, path: fp, content, frontmatter: parseFrontmatter(content) };
    });
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const obj = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    obj[key] = val;
  }
  return obj;
}

function daysSince(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return Infinity;
  return (Date.now() - t) / 86400000;
}

function getTier(kb) {
  const ac = parseInt(kb.access_count || '0', 10);
  const age = daysSince(kb.last_accessed);
  // hot：高频访问优先，不受时间限制（活跃的就是热的）
  if (ac >= TIER_THRESHOLDS.hot_min) return 'hot';
  // warm：访问过 + 不太旧
  if (ac >= TIER_THRESHOLDS.warm_min && age <= TIER_THRESHOLDS.cold_max_age_days) return 'warm';
  // cold：低频 + / 或过期
  return 'cold';
}

// ── 1. tiered-memory ────────────────────────────────

/**
 * 给所有 KB 打分级标签，输出 tier 报告
 */
function tieredMemory() {
  const kbs = loadKBFiles();
  const tiers = { hot: [], warm: [], cold: [] };
  const report = { hot: 0, warm: 0, cold: 0, total: 0, items: [] };

  for (const kb of kbs) {
    const tier = getTier(kb.frontmatter);
    tiers[tier].push(kb);
    report[tier]++;
    report.total++;
    report.items.push({ id: kb.frontmatter.id, tier, ac: kb.frontmatter.access_count });
  }

  // 保存最新状态
  ensureDir(MEMORY_DIR);
  fs.writeFileSync(TIER_STATE_FILE, JSON.stringify({
    updated_at: new Date().toISOString(),
    thresholds: TIER_THRESHOLDS,
    distribution: { hot: report.hot, warm: report.warm, cold: report.cold },
    total: report.total,
  }, null, 2));

  return report;
}

// ── 2. hybrid-retrieve ──────────────────────────────

/**
 * 混合检索：关键词匹配 + 字面相似度 + 图谱关联
 * @param {string} query
 * @param {number} limit
 */
function hybridRetrieve(query, limit = 5) {
  const kbs = loadKBFiles();
  const q = query.toLowerCase();
  const qTokens = q.split(/\s+/).filter(t => t.length >= 2);

  // 第一轮：评分
  const scored = kbs.map(kb => {
    const fm = kb.frontmatter;
    const text = (fm.content || '').toLowerCase() + ' ' + (fm.keywords || '').toLowerCase();

    // 关键词命中
    let kwHits = 0;
    for (const t of qTokens) {
      if (text.includes(t)) kwHits++;
    }
    const kwScore = qTokens.length > 0 ? kwHits / qTokens.length : 0;

    // 字面相似度（bigram 重合）
    const bigrams = new Set();
    for (let i = 0; i < q.length - 1; i++) bigrams.add(q.slice(i, i + 2));
    let biHits = 0;
    for (let i = 0; i < text.length - 1; i++) {
      if (bigrams.has(text.slice(i, i + 2))) biHits++;
    }
    const biScore = bigrams.size > 0 ? biHits / bigrams.size : 0;

    // 热度加分
    const ac = parseInt(fm.access_count || '0', 10);
    const heatBonus = Math.min(0.3, ac * 0.05);

    // 分级加权（hot 1.0, warm 0.7, cold 0.4）
    const tierWeight = { hot: 1.0, warm: 0.7, cold: 0.4 }[getTier(fm)] || 0.5;

    const finalScore = (kwScore * 0.5 + biScore * 0.3 + heatBonus * 0.2) * tierWeight;

    return {
      id: fm.id,
      content: fm.content,
      category: fm.category,
      score: finalScore,
      tier: getTier(fm),
      kwScore, biScore, heatBonus, tierWeight,
    };
  });

  // 过滤 score > 0
  const positive = scored.filter(s => s.score > 0);
  positive.sort((a, b) => b.score - a.score);

  // 第二轮：图谱扩散（如果 graph 存在）
  let graphAdj = null;
  const graphFile = path.join(ASSOCIATIONS_DIR, 'graph.json');
  if (fs.existsSync(graphFile)) {
    const graph = JSON.parse(fs.readFileSync(graphFile, 'utf8'));
    graphAdj = new Map();
    for (const edge of graph.edges) {
      if (!graphAdj.has(edge.source)) graphAdj.set(edge.source, []);
      if (!graphAdj.has(edge.target)) graphAdj.set(edge.target, []);
      graphAdj.get(edge.source).push(edge.target);
      graphAdj.get(edge.target).push(edge.source);
    }
  }

  // 加入图谱关联（1-hop 邻居，分数 0.2x）
  const seen = new Set(positive.slice(0, limit).map(s => s.id));
  const enriched = [...positive.slice(0, limit)];

  if (graphAdj) {
    for (const top of positive.slice(0, Math.min(3, limit))) {
      const neighbors = graphAdj.get(top.id) || [];
      for (const n of neighbors) {
        if (seen.has(n)) continue;
        seen.add(n);
        const nbKb = kbs.find(k => k.frontmatter.id === n);
        if (nbKb) {
          enriched.push({
            id: n,
            content: nbKb.frontmatter.content,
            category: nbKb.frontmatter.category,
            score: top.score * 0.2,
            tier: getTier(nbKb.frontmatter),
            source: 'graph:1hop',
          });
        }
      }
    }
  }

  return enriched.slice(0, limit);
}

// ── 3. self-evolve ──────────────────────────────────

/**
 * 每日进化扫描：
 * - 记录 access_count（已有 left-brain.sh 触发）
 * - 本函数做"分级晋升"和"过期降级"
 * - 输出 evolution log
 */
function selfEvolve() {
  ensureDir(LOGS_DIR);
  const kbs = loadKBFiles();
  const transitions = { promoted: [], demoted: [], unchanged: 0 };
  const prevTier = loadPrevTier();

  for (const kb of kbs) {
    const fm = kb.frontmatter;
    const id = fm.id;
    const newTier = getTier(fm);
    const oldTier = prevTier[id] || 'cold';  // 默认 cold

    if (newTier === oldTier) {
      transitions.unchanged++;
    } else if (
      (oldTier === 'cold' && newTier === 'warm') ||
      (oldTier === 'warm' && newTier === 'hot') ||
      (oldTier === 'cold' && newTier === 'hot')
    ) {
      transitions.promoted.push({ id, from: oldTier, to: newTier });
    } else {
      transitions.demoted.push({ id, from: oldTier, to: newTier });
    }
  }

  // 保存当前 tier
  const currentTier = {};
  for (const kb of kbs) currentTier[kb.frontmatter.id] = getTier(kb.frontmatter);
  fs.writeFileSync(TIER_STATE_FILE, JSON.stringify({
    updated_at: new Date().toISOString(),
    thresholds: TIER_THRESHOLDS,
    transitions,
    current_tier: currentTier,
  }, null, 2));

  // 追加 evolution log
  const logEntry = {
    timestamp: new Date().toISOString(),
    promoted_count: transitions.promoted.length,
    demoted_count: transitions.demoted.length,
    unchanged: transitions.unchanged,
    sample_promoted: transitions.promoted.slice(0, 3),
    sample_demoted: transitions.demoted.slice(0, 3),
  };
  fs.appendFileSync(EVOLUTION_LOG_FILE, JSON.stringify(logEntry) + '\n');

  return transitions;
}

function loadPrevTier() {
  if (!fs.existsSync(TIER_STATE_FILE)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(TIER_STATE_FILE, 'utf8'));
    return data.current_tier || {};
  } catch {
    return {};
  }
}

// ── 4. skill-reuse ──────────────────────────────────

/**
 * 输出 session-init 可消费的 top-K 知识（按分级 + 评分）
 */
function skillReuse(limit = 5) {
  const report = tieredMemory();
  const kbs = loadKBFiles();

  // 优先 hot > warm > cold；同 tier 按 access_count 排序
  const tierOrder = { hot: 0, warm: 1, cold: 2 };
  const sorted = kbs
    .map(kb => ({
      ...kb.frontmatter,
      tier: getTier(kb.frontmatter),
      ac: parseInt(kb.frontmatter.access_count || '0', 10),
    }))
    .sort((a, b) => {
      if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
      return b.ac - a.ac;
    });

  return {
    distribution: { hot: report.hot, warm: report.warm, cold: report.cold },
    top: sorted.slice(0, limit).map(s => ({
      id: s.id,
      content: s.content,
      category: s.category,
      tier: s.tier,
      access_count: s.ac,
    })),
  };
}

// ── 入口 ─────────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2] || 'tier';
  const arg = process.argv[3];

  switch (cmd) {
    case 'tier': {
      const r = tieredMemory();
      console.log('📊 记忆分级报告：');
      console.log(`  🔥 hot:  ${r.hot}`);
      console.log(`  🟡 warm: ${r.warm}`);
      console.log(`  ❄️  cold: ${r.cold}`);
      console.log(`  📦 total: ${r.total}`);
      break;
    }
    case 'retrieve': {
      if (!arg) {
        console.error('用法: node memos.js retrieve "<query>" [limit]');
        process.exit(1);
      }
      const limit = parseInt(process.argv[4] || '5', 10);
      const results = hybridRetrieve(arg, limit);
      console.log(`🔍 混合检索: "${arg}"`);
      for (const r of results) {
        console.log(`  [${r.tier}] ${r.id} (score=${r.score.toFixed(3)})`);
        console.log(`    ${r.content?.slice(0, 80)}`);
      }
      break;
    }
    case 'evolve': {
      const r = selfEvolve();
      console.log('🧬 自我进化完成：');
      console.log(`  ⬆️  晋升: ${r.promoted.length}（hot ${r.promoted.filter(p => p.to === 'hot').length}, warm ${r.promoted.filter(p => p.to === 'warm').length}）`);
      console.log(`  ⬇️  降级: ${r.demoted.length}`);
      console.log(`  ➖  不变: ${r.unchanged}`);
      if (r.promoted.length) console.log('  样本晋升:', r.promoted.slice(0, 3));
      if (r.demoted.length) console.log('  样本降级:', r.demoted.slice(0, 3));
      break;
    }
    case 'reuse': {
      const limit = parseInt(arg || '5', 10);
      const r = skillReuse(limit);
      console.log('♻️  跨任务复用 top:');
      console.log(`  分级: hot=${r.distribution.hot} warm=${r.distribution.warm} cold=${r.distribution.cold}`);
      for (const s of r.top) {
        console.log(`  [${s.tier}] ${s.id} (ac=${s.access_count}) ${s.content?.slice(0, 60)}`);
      }
      break;
    }
    default:
      console.error(`未知命令: ${cmd}（支持: tier / retrieve / evolve / reuse）`);
      process.exit(1);
  }
}

module.exports = {
  tieredMemory,
  hybridRetrieve,
  selfEvolve,
  skillReuse,
  getTier,
  TIER_THRESHOLDS,
};
