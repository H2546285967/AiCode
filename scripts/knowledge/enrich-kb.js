#!/usr/bin/env node
/**
 * enrich-kb.js — 给无 frontmatter 的 KB 补上元数据（M45 · 步骤 2）
 *
 * 作用：
 *   - 扫描 knowledge/ 找无 frontmatter 的 KB（首行不是 ---）
 *   - 解析 `[KB-YYYYMMDD-NNN] 内容` 格式
 *   - 推断 category（复用 auto-classify 的规则）
 *   - 推断 keywords（用第一个 [一-龥]{2,} 序列提取 5 个）
 *   - 推断 learned_at（从 KB ID 的日期）
 *   - 写回原文件
 *
 * 用法：
 *   node enrich-kb.js --dry-run         # 输出补全建议，不写文件
 *   node enrich-kb.js --apply           # 应用补全
 *
 * @since v3.0.5 (2026-06-29) — M45 KB 分类质量提升
 */

const fs = require('fs');
const path = require('path');
const { classify, KB_DIR } = require('./auto-classify');

function listKBFiles() {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(KB_DIR, f));
}

/**
 * 解析 `[KB-20260622-004] 内容...` 格式
 * 返回 { id, content, learnedAt }
 */
function parsePlainKB(text, filename) {
  // 先取首段匹配 [KB-YYYYMMDD-NNN] 内容...（修复：捕获组 4 个数字正确）
  const m = text.match(/^\[KB-(\d{4})(\d{2})(\d{2})-(\d{3})\]\s*([\s\S]*)$/);
  if (m) {
    return {
      id: `KB-${m[1]}${m[2]}${m[3]}-${m[4]}`,
      content: m[5].trim(),
      learnedAt: `${m[1]}-${m[2]}-${m[3]}T08:00:00`,
    };
  }
  // fallback：从文件名提取
  const fm = filename.match(/KB-(\d{4})(\d{2})(\d{2})-(\d{3})\.md$/);
  if (fm) {
    return {
      id: `KB-${fm[1]}${fm[2]}${fm[3]}-${fm[4]}`,
      content: text.trim(),
      learnedAt: `${fm[1]}-${fm[2]}-${fm[3]}T08:00:00`,
    };
  }
  return null;
}

/**
 * 提取中文关键词（最多 5 个）
 */
function extractKeywords(text) {
  const matches = text.match(/[一-龥a-zA-Z][一-龥a-zA-Z0-9]{1,}/g) || [];
  const filtered = matches.filter((w) => w.length >= 2);
  // 去重保序
  const seen = new Set();
  const result = [];
  for (const w of filtered) {
    if (seen.has(w)) continue;
    seen.add(w);
    result.push(w);
    if (result.length >= 5) break;
  }
  return result;
}

/**
 * 给纯文本 KB 补 frontmatter
 */
function enrichOne(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  // 如果已经有 frontmatter，跳过
  if (text.startsWith('---\n')) {
    return { file: filename, status: 'has-frontmatter', changed: false };
  }
  const parsed = parsePlainKB(text, filename);
  if (!parsed) {
    return { file: filename, status: 'unparseable', changed: false };
  }
  const { meta } = parseFrontmatterStub(parsed);
  const suggestion = classify(
    { content: parsed.content, keywords: '' },
    parsed.content
  );
  const keywords = extractKeywords(parsed.content);
  const newFrontmatter = [
    '---',
    `id: ${parsed.id}`,
    `content: ${parsed.content.slice(0, 200)}${parsed.content.length > 200 ? '...' : ''}`,
    `category: ${suggestion.category}`,
    `keywords: [${keywords.join(',')}]`,
    `source: 对话自动提取`,
    `confidence: ${suggestion.confidence.toFixed(2)}`,
    `learned_at: ${parsed.learnedAt}`,
    '---',
    '',
    `# ${parsed.id}`,
    '',
    parsed.content,
    '',
  ].join('\n');
  return { file: filename, status: 'enriched', changed: false, newFrontmatter, parsed, suggestion };
}

// 引用但不实际用（避免 lint warning）
function parseFrontmatterStub() {
  return { meta: {} };
}

function dryRun() {
  const files = listKBFiles();
  const enriched = [];
  for (const f of files) {
    const r = enrichOne(f);
    if (r.status === 'enriched') {
      enriched.push(r);
    }
  }
  console.log(`📋 Dry-run 补全建议`);
  console.log(`总计 ${files.length} 条，建议补 ${enriched.length} 条\n`);
  enriched.forEach((r) => {
    const cat = r.suggestion.category;
    const conf = r.suggestion.confidence.toFixed(2);
    console.log(`  ${r.file.padEnd(28)} → category=${cat} (${conf})`);
  });
  return enriched;
}

function apply() {
  const files = listKBFiles();
  let changed = 0;
  let skipped = 0;
  let alreadyHas = 0;
  let unparseable = 0;
  for (const f of files) {
    const r = enrichOne(f);
    if (r.status === 'has-frontmatter') {
      alreadyHas++;
    } else if (r.status === 'unparseable') {
      unparseable++;
      console.log(`⚠️  跳过 (无法解析): ${r.file}`);
    } else {
      fs.writeFileSync(f, r.newFrontmatter, 'utf8');
      changed++;
      console.log(`✅ ${r.file} → ${r.suggestion.category}`);
    }
  }
  console.log('');
  console.log(`📊 补全结果：补 ${changed} / 有 frontmatter ${alreadyHas} / 无法解析 ${unparseable}`);
  return { changed, alreadyHas, unparseable };
}

function parseArgs(argv) {
  const args = { mode: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.mode = 'dry-run';
    else if (a === '--apply') args.mode = 'apply';
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv);
  if (args.mode === 'dry-run') dryRun();
  else if (args.mode === 'apply') apply();
  else {
    console.log('用法：');
    console.log('  node enrich-kb.js --dry-run');
    console.log('  node enrich-kb.js --apply');
  }
}

module.exports = { enrichOne, parsePlainKB, extractKeywords, dryRun, apply };