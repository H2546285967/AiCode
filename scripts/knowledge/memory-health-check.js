#!/usr/bin/env node
/**
 * memory-health-check.js — MEMORY.md 体检脚本（M48-D · neat-freak 借鉴）
 *
 * 体检 4 项：
 *   1. MEMORY.md ≤ 200 行 且 ≤ 25KB（硬约束，超出会被静默截断）
 *   2. MEMORY.md ≤ 25KB（重申）
 *   3. 单条 memory 文件 ≤ 100 行（软）
 *   4. docs 体量 vs memory 体量 倒挂检查（健康态 = docs 厚、memory 薄）
 *
 * 退出码：
 *   0 = all OK
 *   1 = 有 WARN（建议处理）
 *   2 = 有 ERROR（必须处理，超尺寸静默丢失）
 *
 * 用法：
 *   node memory-health-check.js              # 跑全部检查
 *   node memory-health-check.js --json       # 输出 JSON
 *   node memory-health-check.js --ci         # CI 模式（静默，只有退出码）
 *   node memory-health-check.js --kb-root <path>  # 自定义 KB 目录
 *
 * @since v3.0.6 (2026-06-29) — M48-D neat-freak 完整借鉴
 * @source 04_自我演进路线.md §0.4 增量 M48-D
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..');
const MEMORY_DIR = path.join(
  WORKSPACE_ROOT,
  '.claude',
  'skills',
  'left-brain',
  'memory'
);
const MEMORY_INDEX = path.join(MEMORY_DIR, 'MEMORY.md');
const KNOWLEDGE_DIR = path.join(MEMORY_DIR, 'knowledge');
const DOCS_DIR = path.join(WORKSPACE_ROOT, 'docs');

const THRESHOLDS = {
  MEMORY_INDEX_LINES: { value: 200, severity: 'error', label: 'MEMORY.md ≤ 200 行（硬约束，超出会被 Claude Code 静默截断）' },
  MEMORY_INDEX_BYTES: { value: 25 * 1024, severity: 'error', label: 'MEMORY.md ≤ 25KB（硬约束）' },
  SINGLE_KB_LINES: { value: 100, severity: 'warn', label: '单条 KB ≤ 100 行（软约束，超了拆 / 删 / 改 reference）' },
  // 体量倒挂 = memory > 30% docs
  VOLUME_INVERSION_RATIO: { value: 0.3, severity: 'warn', label: 'memory 体量 ≤ docs 的 30%（健康态是 docs 厚 memory 薄）' },
};

// ── 工具函数 ─────────────────────────────────────────

function fileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function lineCount(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function dirSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && p.endsWith('.md')) total += fileSize(p);
    }
  }
  walk(dir);
  return total;
}

/**
 * 格式化字节
 */
function fmtBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

// ── 检查项 ───────────────────────────────────────────

function checkMemoryIndex() {
  const lines = lineCount(MEMORY_INDEX);
  const bytes = fileSize(MEMORY_INDEX);
  const issues = [];
  if (lines > THRESHOLDS.MEMORY_INDEX_LINES.value) {
    issues.push({
      severity: 'error',
      label: THRESHOLDS.MEMORY_INDEX_LINES.label,
      actual: `${lines} 行`,
      fix: '跑 npm run kb:promote -- --report，把稳定 KB 升 docs；MEMORY.md 只留 1 行 pointer',
    });
  }
  if (bytes > THRESHOLDS.MEMORY_INDEX_BYTES.value) {
    issues.push({
      severity: 'error',
      label: THRESHOLDS.MEMORY_INDEX_BYTES.label,
      actual: fmtBytes(bytes),
      fix: 'MEMORY.md 顶部 200 行 / 25KB 之外静默不加载，必须精剪',
    });
  }
  return {
    name: 'MEMORY_INDEX',
    file: MEMORY_INDEX,
    lines,
    bytes,
    issues,
  };
}

function checkSingleKBs(kbDirOverride) {
  const dir = kbDirOverride || KNOWLEDGE_DIR;
  if (!fs.existsSync(dir)) {
    return { name: 'SINGLE_KB', issues: [], total: 0, oversized: 0, dir };
  }
  const issues = [];
  let total = 0;
  let oversized = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const fp = path.join(dir, f);
    const lines = lineCount(fp);
    total++;
    if (lines > THRESHOLDS.SINGLE_KB_LINES.value) {
      oversized++;
      issues.push({
        severity: 'warn',
        label: `${f}: ${lines} 行 > ${THRESHOLDS.SINGLE_KB_LINES.value}`,
        actual: `${lines} 行`,
        fix: '拆 / 删 / 改成 reference；考虑用 kb:promote 升 docs',
      });
    }
  }
  return {
    name: 'SINGLE_KB',
    issues: issues.length ? [{
      severity: 'warn',
      label: THRESHOLDS.SINGLE_KB_LINES.label,
      actual: `${oversized}/${total} 条超尺寸`,
      fix: '见下方明细',
    }] : [],
    total,
    oversized,
    details: issues,
  };
}

function checkVolumeInversion(docsDirOverride) {
  const docsDir = docsDirOverride || DOCS_DIR;
  const memoryBytes = dirSize(MEMORY_DIR);
  const docsBytes = dirSize(docsDir);
  // 没有 docs 目录 = 个人工程，跳过（没可比对象）
  if (docsBytes === 0) {
    return {
      name: 'VOLUME_INVERSION',
      memoryBytes,
      docsBytes: 0,
      skipped: true,
      reason: '无 docs/ 目录（个人工程，无可比对象）',
      issues: [],
    };
  }
  const ratio = memoryBytes / docsBytes;
  const issues = [];
  if (ratio > THRESHOLDS.VOLUME_INVERSION_RATIO.value) {
    issues.push({
      severity: 'warn',
      label: THRESHOLDS.VOLUME_INVERSION_RATIO.label,
      actual: `memory / docs = ${(ratio * 100).toFixed(1)}% (${fmtBytes(memoryBytes)} / ${fmtBytes(docsBytes)})`,
      fix: '跑 npm run kb:promote -- --report 把稳定 KB 升 docs',
    });
  }
  return {
    name: 'VOLUME_INVERSION',
    memoryBytes,
    docsBytes,
    ratio,
    issues,
  };
}

// ── 主流程 ───────────────────────────────────────────

function runAll() {
  const memoryIdx = checkMemoryIndex();
  const singleKB = checkSingleKBs();
  const volume = checkVolumeInversion();

  const allIssues = [
    ...memoryIdx.issues,
    ...singleKB.issues,
    ...volume.issues,
  ];

  return {
    timestamp: new Date().toISOString(),
    checks: [memoryIdx, singleKB, volume],
    issues: allIssues,
    summary: {
      total: allIssues.length,
      error: allIssues.filter(i => i.severity === 'error').length,
      warn: allIssues.filter(i => i.severity === 'warn').length,
    },
  };
}

// ── 报告输出 ─────────────────────────────────────────

function printReport(result, { json = false, ci = false } = {}) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (ci) return; // CI mode 静默

  console.log(`\n🩺 MEMORY.md 体检报告 (${result.timestamp.slice(0, 10)})\n`);
  console.log('=' .repeat(60));

  for (const check of result.checks) {
    console.log(`\n📋 ${check.name}`);
    if (check.skipped) {
      console.log(`   ⏭️  ${check.reason}`);
      continue;
    }
    if (check.file) {
      console.log(`   文件: ${path.relative(WORKSPACE_ROOT, check.file)}`);
      console.log(`   行数: ${check.lines}`);
      console.log(`   字节: ${fmtBytes(check.bytes)}`);
    }
    if (check.name === 'SINGLE_KB') {
      console.log(`   KB 总数: ${check.total}`);
      console.log(`   超尺寸: ${check.oversized}`);
    }
    if (check.name === 'VOLUME_INVERSION') {
      console.log(`   memory: ${fmtBytes(check.memoryBytes)}`);
      console.log(`   docs:   ${fmtBytes(check.docsBytes)}`);
      console.log(`   比率:   ${(check.ratio * 100).toFixed(1)}%`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 总结:`);
  console.log(`   - ERROR: ${result.summary.error} 条 (必须处理)`);
  console.log(`   - WARN:  ${result.summary.warn} 条 (建议处理)`);

  if (result.issues.length > 0) {
    console.log(`\n📌 问题清单:\n`);
    for (const i of result.issues) {
      const icon = i.severity === 'error' ? '🔴' : '🟡';
      console.log(`${icon} [${i.severity.toUpperCase()}] ${i.label}`);
      console.log(`   实际: ${i.actual}`);
      console.log(`   修复: ${i.fix}\n`);
    }
  } else {
    console.log('\n✅ 全部通过！\n');
  }

  // single-kb 明细
  const singleKB = result.checks.find(c => c.name === 'SINGLE_KB');
  if (singleKB && singleKB.details && singleKB.details.length > 0) {
    console.log('📄 超尺寸 KB 明细:\n');
    for (const d of singleKB.details) {
      console.log(`  - ${d.label}`);
    }
    console.log('');
  }
}

// ── CLI ──────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    json: args.includes('--json'),
    ci: args.includes('--ci'),
  };
}

function exitCode(result) {
  if (result.summary.error > 0) return 2;
  if (result.summary.warn > 0) return 1;
  return 0;
}

function main() {
  const opts = parseArgs();
  const result = runAll();
  printReport(result, opts);
  process.exit(exitCode(result));
}

if (require.main === module) {
  main();
}

module.exports = { runAll, exitCode, printReport, checkMemoryIndex, checkSingleKBs, checkVolumeInversion, dirSize, fileSize, lineCount, THRESHOLDS };
