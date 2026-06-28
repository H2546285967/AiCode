#!/usr/bin/env node
/**
 * sync-l5-progress.js — 月度 L5 进度从 metrics 报告同步到 04.md（research-skill-ecosystem-20260626 推荐路径第 1 步）
 *
 * 作用：
 *   - 读 data/evolution/metrics-YYYYMM.md 的 L5 5 条达标进度表格
 *   - 读 04_自我演进路线.md §0.5 的 L5 5 条真实进度表格
 *   - diff 后输出"需同步项"清单（默认 dry-run，不改文件）
 *   - 加 --write 真正改 04.md + 顶部"最近一次同步"时间戳
 *
 * 设计原则：
 *   - 零依赖（fs + path）
 *   - 默认 dry-run（安全，不破坏 04.md）
 *   - 解析容错（找不到 table → 返回 error）
 *   - 与 metrics:report 串行：先 `npm run metrics:report` 生成报告，再 `npm run metrics:sync-l5`
 *
 * 用法：
 *   node sync-l5-progress.js                 # 默认上个月 dry-run
 *   node sync-l5-progress.js 202606          # 指定月份
 *   node sync-l5-progress.js 202606 --write  # 真同步
 *   node sync-l5-progress.js --status        # 看最近一次同步状态
 *
 * @since v3.0.5 (2026-06-28) RESEARCH-research-skill-ecosystem-20260626
 * @source .claude/audits/research-skill-ecosystem-20260626.md §推荐路径第 1 步
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const REPORT_DIR = path.join(WORKSPACE_ROOT, 'data', 'evolution');
const ROADMAP_MD = path.join(WORKSPACE_ROOT, '04_自我演进路线.md');
const LOG_DIR = path.join(WORKSPACE_ROOT, 'data', 'l5-sync');

// ── 工具函数 ─────────────────────────────────────────

function readFileSafe(file, def = '') {
  try { return fs.readFileSync(file, 'utf8'); }
  catch { return def; }
}

function now() {
  return new Date().toISOString();
}

function nowShort() {
  return now().replace(/[:.]/g, '-').replace(/T/, '_').slice(0, 19);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) {
  console.log(`[sync-l5] ${msg}`);
}

// ── 解析 metrics-YYYYMM.md 的 L5 段 ────────────────────

/**
 * 从 metrics 报告里解析 L5 5 条达标进度
 * @returns {Array<{n: number, condition: string, status: string}>}
 */
function parseMetricsL5(md) {
  const startIdx = md.indexOf('## 🎯 L5 终极智能达标进度');
  if (startIdx === -1) return null;

  const lines = md.split('\n');
  const result = [];
  let inTable = false;
  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('## 🎯 L5 终极智能达标进度')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    // 匹配表头行：含 "条件" + "状态"（metrics 用"本月状态"，04.md 用"当前状态"）
    if (!headerFound && /^\|.*条件.*状态/.test(lines[i]) && /#/.test(lines[i])) {
      headerFound = true;
      continue;
    }
    if (headerFound && /^\|---/.test(lines[i])) continue;
    if (headerFound && /^\|/.test(lines[i])) {
      const m = lines[i].match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
      if (m) {
        result.push({
          n: parseInt(m[1], 10),
          condition: m[2].trim(),
          status: m[3].trim(),
        });
      }
    } else if (headerFound && !/^\|/.test(lines[i])) {
      break;
    }
  }
  return result;
}

// ── 解析 04.md §0.5 的 L5 5 条真实进度 ─────────────────

/**
 * 从 04.md 解析 L5 5 条真实进度表格
 * 兼容 04.md 中表格行带 `> ` 引用前缀（quote blockquote）的格式
 * @returns {Array<{n: number, condition: string, status: string}>}
 */
function parseRoadmapL5(md) {
  const startIdx = md.indexOf('**L5 5 条真实进度**');
  if (startIdx === -1) return null;

  const lines = md.split('\n');
  const result = [];
  let inTable = false;
  let headerFound = false;

  // 去掉 `> ` 引用前缀后再匹配
  const unquote = l => l.replace(/^>\s?/, '');

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('**L5 5 条真实进度**')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    const clean = unquote(lines[i]);
    // 匹配表头行：含 "#" + "条件" + "当前状态"
    if (!headerFound && /^\|.*条件.*当前状态/.test(clean)) {
      headerFound = true;
      continue;
    }
    if (headerFound && /^\|---/.test(clean)) continue;
    if (headerFound && /^\|/.test(clean)) {
      const m = clean.match(/^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
      if (m) {
        result.push({
          n: parseInt(m[1], 10),
          condition: m[2].trim(),
          status: m[3].trim(),
          link: m[4].trim(),
        });
      }
    } else if (headerFound && !/^\|/.test(clean)) {
      break;
    }
  }
  return result;
}

// ── diff 核心 ─────────────────────────────────────────

/**
 * 比对 metrics 和 04.md 的 L5 状态
 * - 用"是否含 ✅"作为判定标准（metrics 是事实源）
 * - 输出待同步项清单
 * @returns {{changes: Array<{n: number, before: string, after: string}>, inSync: boolean, error: string|null}}
 */
function diffL5(metricsRows, roadmapRows) {
  if (!metricsRows || metricsRows.length === 0) {
    return { changes: [], inSync: true, error: 'metrics 报告未找到 L5 段或 5 条不全' };
  }
  if (!roadmapRows || roadmapRows.length === 0) {
    return { changes: [], inSync: true, error: '04.md §0.5 未找到 L5 段或 5 条不全' };
  }

  const changes = [];
  for (const m of metricsRows) {
    const r = roadmapRows.find(x => x.n === m.n);
    if (!r) continue;

    const mOk = /✅/.test(m.status);
    const rOk = /✅/.test(r.status);

    if (mOk !== rOk) {
      changes.push({
        n: m.n,
        before: r.status.slice(0, 60),
        after: m.status.slice(0, 60),
        condition: m.condition.slice(0, 50),
      });
    }
  }

  return { changes, inSync: changes.length === 0, error: null };
}

// ── 应用 diff 到 04.md ────────────────────────────────

function applyChanges(md, changes, metricsRows) {
  if (changes.length === 0) return md;
  const lines = md.split('\n');
  const startIdx = lines.findIndex(l => l.includes('**L5 5 条真实进度**'));
  if (startIdx === -1) return md;

  // 去掉 `> ` 引用前缀后再匹配（兼容 04.md 表格在引用块里）
  const unquote = l => l.replace(/^>\s?/, '');

  // 找到表格 header + body 范围
  let headerLineIdx = -1, sepLineIdx = -1, bodyEndIdx = -1;
  for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
    const clean = unquote(lines[i]);
    if (headerLineIdx === -1 && /^\|.*条件.*当前状态/.test(clean)) headerLineIdx = i;
    // 分隔行：含多个 `:--` 或 `|---` 即可（兼容 `|:--|:---|` 与 `|---|---|`）
    if (headerLineIdx !== -1 && sepLineIdx === -1 && /^\|[:\s-]+/.test(clean) && /-{2,}/.test(clean)) sepLineIdx = i;
    if (sepLineIdx !== -1 && bodyEndIdx === -1 && i > sepLineIdx && !/^\|/.test(clean)) {
      bodyEndIdx = i;
      break;
    }
  }
  if (headerLineIdx === -1 || sepLineIdx === -1 || bodyEndIdx === -1) return md;

  // 对每个 change，从 metrics 取新 status 替换 04.md 第 n 行的 status 列
  let updated = [...lines];
  for (const ch of changes) {
    const m = metricsRows.find(x => x.n === ch.n);
    if (!m) continue;
    for (let i = sepLineIdx + 1; i < bodyEndIdx; i++) {
      // 用 split('|') 拆列：| 1 | 条件 | status | link |  → 6 cols（首尾是空）
      // 注意：行可能带 `> ` 前缀，先去掉再 split
      const clean = unquote(updated[i]);
      const cols = clean.split('|');
      if (cols.length < 6) continue;
      const n = parseInt(cols[1].trim(), 10);
      if (n === ch.n) {
        // 替换 status 列（cols[3]），保留前后空白
        cols[3] = ` ${m.status} `;
        const newClean = cols.join('|');
        // 保留原行前缀（如果有 `> `）
        const prefix = updated[i].match(/^>\s?/) ? updated[i].match(/^>\s?/)[0] : '';
        updated[i] = prefix + newClean;
        break;
      }
    }
  }

  // 更新顶部"最近一次同步"（兼容 CRLF 行尾：去掉 \r 后匹配）
  updated = updated.map(l =>
    /\*\*最近一次同步\*\*：/.test(l)
      ? l.replace(/(\*\*最近一次同步\*\*：)\d{4}-\d{2}-\d{2}/, `$1${now().slice(0, 10)} (v3.0.5 RESEARCH-sync-l5 自动同步：${changes.length} 项 L5 状态)`)
      : l
  );

  return updated.join('\n');
}

// ── 主入口 ────────────────────────────────────────────

function findLatestReport() {
  if (!fs.existsSync(REPORT_DIR)) return null;
  const files = fs.readdirSync(REPORT_DIR)
    .filter(f => /^metrics-\d{6}\.md$/.test(f))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(REPORT_DIR, files[0]) : null;
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const isStatus = args.includes('--status');
  const yyyymm = args.find(a => /^\d{6}$/.test(a));

  // status 命令
  if (isStatus) {
    const latest = findLatestReport();
    log(`最新月度报告: ${latest ? path.basename(latest) : '(无)'}`);
    if (latest) {
      const md = readFileSafe(latest);
      const rows = parseMetricsL5(md);
      log(`L5 5 条: ${rows ? rows.length : 0}`);
      if (rows) {
        rows.forEach(r => log(`  ${r.n}. ${/✅/.test(r.status) ? '✅' : '🟡/⏳'}  ${r.condition.slice(0, 40)}`));
      }
    }
    const roadmap = readFileSafe(ROADMAP_MD);
    const rRows = parseRoadmapL5(roadmap);
    log(`04.md L5 5 条: ${rRows ? rRows.length : 0}`);
    return;
  }

  // 找目标月度报告
  let reportPath;
  if (yyyymm) {
    reportPath = path.join(REPORT_DIR, `metrics-${yyyymm}.md`);
    if (!fs.existsSync(reportPath)) {
      log(`❌ 报告不存在: ${reportPath}`);
      log(`   先跑: npm run metrics:report ${yyyymm}`);
      process.exit(1);
    }
  } else {
    reportPath = findLatestReport();
    if (!reportPath) {
      log('❌ 未找到任何 metrics-YYYYMM.md 报告');
      log('   先跑: npm run metrics:report');
      process.exit(1);
    }
  }

  const metricsMd = readFileSafe(reportPath);
  const roadmapMd = readFileSafe(ROADMAP_MD);
  if (!roadmapMd) {
    log(`❌ 04.md 不存在: ${ROADMAP_MD}`);
    process.exit(1);
  }

  const metricsRows = parseMetricsL5(metricsMd);
  const roadmapRows = parseRoadmapL5(roadmapMd);
  const diff = diffL5(metricsRows, roadmapRows);

  if (diff.error) {
    log(`❌ ${diff.error}`);
    process.exit(1);
  }

  log(`📊 月度报告: ${path.basename(reportPath)}`);
  log(`📄 04.md §0.5 L5 段: ${roadmapRows.length} 条`);
  log(`📋 metrics L5 段: ${metricsRows.length} 条`);

  if (diff.inSync) {
    log('✅ L5 状态已同步，无需变更');
    return;
  }

  log(`⚠️  发现 ${diff.changes.length} 项需同步:`);
  diff.changes.forEach(c => {
    log(`  ${c.n}. ${c.condition}`);
    log(`     - 04.md:    ${c.before}`);
    log(`     + metrics:  ${c.after}`);
  });

  if (write) {
    const newMd = applyChanges(roadmapMd, diff.changes, metricsRows);
    if (newMd === roadmapMd) {
      log('⏭️  应用后无变更，跳过');
      return;
    }
    fs.writeFileSync(ROADMAP_MD, newMd);
    log(`✅ 04.md 已更新（${diff.changes.length} 项）`);

    // 写日志
    ensureDir(LOG_DIR);
    const logFile = path.join(LOG_DIR, `l5-sync-${nowShort()}.md`);
    const content = [
      `# L5 同步日志`,
      ``,
      `- 时间：${now()}`,
      `- 触发：metrics ${path.basename(reportPath)}`,
      `- 同步项：${diff.changes.length}`,
      ...diff.changes.map(c => `  - ${c.n}. ${c.condition}: ${c.before} → ${c.after}`),
      `- 状态：✅ 已写入 04.md`,
    ].join('\n');
    fs.writeFileSync(logFile, content);
    log(`📝 日志: ${logFile}`);
  } else {
    log('🔍 DRY-RUN: 加 --write 真同步');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseMetricsL5,
  parseRoadmapL5,
  diffL5,
  applyChanges,
  findLatestReport,
};