#!/usr/bin/env node
/**
 * auto-classify.js — KB 自动分类器（M45 · KB 分类质量提升）
 *
 * 作用：
 *   - 把 KB 中标"其他"的条目按关键词重新归类（目标 75% → < 20%）
 *   - 支持 UTF-8 / GBK 双编码自动识别
 *   - 纯函数离线，不接 hook
 *
 * 用法：
 *   node auto-classify.js --dry-run            # 输出分类建议，不写文件
 *   node auto-classify.js --apply              # 应用高置信度（>=0.80）的建议
 *   node auto-classify.js --apply --threshold 0.7
 *   node auto-classify.js --report             # 统计当前分类分布
 *   node auto-classify.js --detect-encoding <file>   # 测单文件编码
 *
 * @since v3.0.5 (2026-06-29) — M45 KB 分类质量提升
 * @source 04_自我演进路线.md §0.4 增量 M45
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..');
const KB_DIR = path.join(
  WORKSPACE_ROOT,
  '.claude',
  'skills',
  'left-brain',
  'memory',
  'knowledge'
);

// 分类规则（关键词 → 类别 + 置信度）
// 顺序：先匹配置信度高的
const CLASSIFY_RULES = [
  // 偏好类（用户习惯 / 纠正）
  {
    category: '偏好',
    confidence: 0.95,
    patterns: [/不要/, /不对/, /错了/, /纠正/, /喜欢/, /讨厌/, /偏好/, /习惯/],
  },
  // 决策类（技术方案 / 选型）
  {
    category: '决策',
    confidence: 0.90,
    patterns: [/决定/, /选择/, /方案/, /确认/, /采用/, /切换/, /迁移到/, /选/],
  },
  // 事件类（时间 / 会议 / 节点）
  {
    category: '事件',
    confidence: 0.85,
    patterns: [/会议/, /年会/, /周会/, /月报/, /上线/, /发版/, /\d{4}-\d{2}-\d{2}/, /Day\s*\d+/],
  },
  // 人物类（人名 / 协作）
  {
    category: '人物',
    confidence: 0.85,
    patterns: [/小王/, /小李/, /领导/, /同事/, /负责/, /对接/, /汇报/, /韩宗辉/],
  },
  // 工程经验类（最佳实践 / 教训 / 复盘）
  {
    category: '工程经验',
    confidence: 0.85,
    patterns: [/教训/, /复盘/, /踩坑/, /最佳实践/, /经验/, /规则/, /规范/, /原则/],
  },
  // 概念澄清类（术语 / 定义）
  {
    category: '概念澄清',
    confidence: 0.80,
    patterns: [/是什么/, /定义/, /澄清/, /概念/, /区别/, /含义/],
  },
  // 技术类（技术栈 / API / 框架）
  {
    category: '技术',
    confidence: 0.80,
    patterns: [/项目/, /开发/, /代码/, /技术/, /框架/, /API/, /SDK/, /数据库/, /Spring/, /Vue/, /React/, /MCP/, /skill/, /hook/],
  },
  // Bug 修复类（仅当 content 含修复 / bug 字样且 confidence 字段匹配）
  {
    category: 'bug_fix',
    confidence: 0.85,
    patterns: [/Bug/, /修复/, /\bfix\b/, /\bbug\b/, /\berror\b/],
  },
  // Feature 类
  {
    category: 'feature_full',
    confidence: 0.85,
    patterns: [/M\d+/, /增量/, /里程碑/, /完成/, /交付/, /v1\.\d/, /v2\.\d/, /v3\.\d/, /批次/, /工作流/, /已上线/, /上线完成/, /实施/],
  },
];

// ── 工具函数 ─────────────────────────────────────────

/**
 * 检测文件编码
 * - UTF-8 BOM → utf8
 * - 文件字节尝试 UTF-8 解码：
 *   - 解出来的内容里 category: 后面是合法中文（[一-龥] 范围）→ utf8
 *   - 否则尝试 GB18030 解码：
 *     - 解出来的内容里 category: 后面是合法中文 → gb18030
 * - 默认 utf8
 *
 * 关键启发：用 frontmatter 里的 category 字段检测 — 它格式固定，值域小（合法中文字符或英文字母），最容易判断。
 */
function detectEncoding(buffer) {
  // 1. UTF-8 BOM
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'utf8';
  }
  // 2. 提取 category 行作为测试样本
  const tryDecode = (encoding) => {
    try {
      const text = new TextDecoder(encoding, { fatal: false }).decode(buffer);
      const m = text.match(/^category:\s*(.+)$/m);
      if (!m) return null;
      return m[1].trim();
    } catch {
      return null;
    }
  };
  // 3. 检测：哪一编码能解出合法 category 值
  // 合法 category：中文字符（[一-龥]）或英文字母+下划线
  const isValidCategory = (s) => {
    if (!s) return false;
    if (/^[a-zA-Z_]+$/.test(s)) return true; // 英文: bug_fix, feature_full
    if (/[一-龥]/.test(s) && !/�/.test(s)) return true; // 中文（无 replacement char）
    return false;
  };
  const utf8Cat = tryDecode('utf-8');
  if (isValidCategory(utf8Cat)) {
    return 'utf8';
  }
  const gbCat = tryDecode('gb18030');
  if (isValidCategory(gbCat)) {
    return 'gb18030';
  }
  // 4. 兜底
  return 'utf8';
}

/**
 * 用 Node 内置 TextDecoder 解码（支持 utf8 / gb18030 / gbk 等）
 */
function decodeBuffer(buffer, encoding) {
  try {
    const dec = new TextDecoder(encoding, { fatal: false });
    return dec.decode(buffer);
  } catch {
    // fallback to utf8 with replacement
    return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  }
}

/**
 * 解析 KB 文件 frontmatter
 */
function parseKB(text) {
  const m = text.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: null, body: text, raw: text };
  const yamlBlock = m[1];
  const body = m[2];
  const meta = {};
  yamlBlock.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // 去掉引号
    val = val.replace(/^["']|["']$/g, '');
    meta[key] = val;
  });
  return { meta, body, raw: text };
}

/**
 * 重新构造 KB frontmatter（保留字段顺序）
 */
function rebuildKB(originalText, newMeta) {
  const { meta, body } = parseKB(originalText);
  if (!meta) return originalText;
  const merged = { ...meta, ...newMeta };
  const lines = ['---'];
  Object.keys(merged).forEach((k) => {
    lines.push(`${k}: ${merged[k]}`);
  });
  lines.push('---');
  lines.push(body);
  return lines.join('\n');
}

/**
 * 给定 KB frontmatter + body → 推断分类
 * 返回 { category, confidence, matchedRules }
 */
function classify(meta, body) {
  const text = [meta?.content || '', meta?.keywords || '', body || ''].join(' ');
  const matches = [];
  for (const rule of CLASSIFY_RULES) {
    for (const pat of rule.patterns) {
      if (pat.test(text)) {
        matches.push({ category: rule.category, confidence: rule.confidence, pattern: pat.source });
        break;
      }
    }
  }
  if (matches.length === 0) {
    return { category: '其他', confidence: 0.5, matchedRules: [] };
  }
  // 取最高置信度
  matches.sort((a, b) => b.confidence - a.confidence);
  return {
    category: matches[0].category,
    confidence: matches[0].confidence,
    matchedRules: matches,
  };
}

// ── 主流程 ─────────────────────────────────────────

function listKBFiles() {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(KB_DIR, f));
}

function classifyOne(filePath) {
  const buf = fs.readFileSync(filePath);
  const encoding = detectEncoding(buf);
  const text = decodeBuffer(buf, encoding);
  const { meta, body } = parseKB(text);
  if (!meta) {
    return { file: filePath, error: 'no-frontmatter', encoding };
  }
  const current = meta.category || '其他';
  const suggestion = classify(meta, body);
  return {
    file: path.basename(filePath),
    path: filePath,
    encoding,
    current,
    suggestion: suggestion.category,
    confidence: suggestion.confidence,
    matchedRules: suggestion.matchedRules,
    willChange: current !== suggestion.category,
  };
}

function report() {
  const files = listKBFiles();
  const dist = {};
  let otherCount = 0;
  files.forEach((f) => {
    const buf = fs.readFileSync(f);
    const encoding = detectEncoding(buf);
    const text = decodeBuffer(buf, encoding);
    const { meta } = parseKB(text);
    const cat = meta?.category || '(无 frontmatter)';
    dist[cat] = (dist[cat] || 0) + 1;
    if (cat === '其他') otherCount++;
  });
  const total = files.length;
  console.log(`📊 KB 分类分布（共 ${total} 条）`);
  console.log('');
  const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  for (const [cat, n] of sorted) {
    const pct = ((n / total) * 100).toFixed(1);
    console.log(`  ${cat.padEnd(15)} ${n.toString().padStart(3)} (${pct}%)`);
  }
  console.log('');
  console.log(`🎯 其他占比: ${((otherCount / total) * 100).toFixed(1)}% (目标 < 20%)`);
  return { total, dist, otherCount };
}

function dryRun(threshold = 0.8) {
  const files = listKBFiles();
  const suggestions = [];
  files.forEach((f) => {
    const r = classifyOne(f);
    if (r.willChange && r.confidence >= threshold) {
      suggestions.push(r);
    }
  });
  console.log(`📋 Dry-run 分类建议（threshold=${threshold}）`);
  console.log(`总计 ${files.length} 条，建议改 ${suggestions.length} 条`);
  console.log('');
  suggestions.forEach((s) => {
    console.log(
      `  ${s.file.padEnd(28)} ${s.current} → ${s.suggestion} (${s.confidence.toFixed(2)}) [${s.encoding}]`
    );
  });
  return suggestions;
}

function apply(threshold = 0.8) {
  const files = listKBFiles();
  let changed = 0;
  let skipped = 0;
  let unchanged = 0;
  files.forEach((f) => {
    const r = classifyOne(f);
    if (!r.willChange) {
      unchanged++;
      return;
    }
    if (r.confidence < threshold) {
      skipped++;
      return;
    }
    const buf = fs.readFileSync(f);
    const encoding = detectEncoding(buf);
    const text = decodeBuffer(buf, encoding);
    const newText = rebuildKB(text, { category: r.suggestion });
    fs.writeFileSync(f, newText, 'utf8');
    changed++;
    console.log(`✅ ${path.basename(f)}: ${r.current} → ${r.suggestion}`);
  });
  console.log('');
  console.log(`📊 应用结果：改 ${changed} 条 / 跳过 ${skipped} 条 / 无需改 ${unchanged} 条`);
  return { changed, skipped, unchanged };
}

function detectSingle(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(filePath);
  const enc = detectEncoding(buf);
  console.log(`文件: ${filePath}`);
  console.log(`编码: ${enc}`);
  console.log(`大小: ${buf.length} 字节`);
  const text = decodeBuffer(buf, enc);
  console.log(`前 100 字符: ${text.slice(0, 100)}`);
}

/**
 * 把单个 KB 文件转码为 UTF-8（GB18030 → UTF-8）
 * 返回 { changed: bool, from: string, to: 'utf8' }
 */
function convertToUTF8(filePath) {
  const buf = fs.readFileSync(filePath);
  const enc = detectEncoding(buf);
  if (enc === 'utf8') {
    return { changed: false, from: 'utf8', to: 'utf8' };
  }
  const text = decodeBuffer(buf, enc);
  // BOM 会让 frontmatter 解析失败，必须去除
  const cleanText = text.replace(/^﻿/, '');
  fs.writeFileSync(filePath, cleanText, 'utf8');
  return { changed: true, from: enc, to: 'utf8' };
}

function convertAll() {
  const files = listKBFiles();
  let converted = 0;
  let alreadyUtf8 = 0;
  const failed = [];
  for (const f of files) {
    try {
      const r = convertToUTF8(f);
      if (r.changed) {
        converted++;
        console.log(`🔄 ${path.basename(f)}: ${r.from} → utf8`);
      } else {
        alreadyUtf8++;
      }
    } catch (e) {
      failed.push({ file: path.basename(f), error: e.message });
    }
  }
  console.log('');
  console.log(`📊 转码结果：转 ${converted} 条 / 已是 UTF-8 ${alreadyUtf8} 条${failed.length ? ' / 失败 ' + failed.length + ' 条' : ''}`);
  if (failed.length) {
    console.log('失败清单:');
    failed.forEach((f) => console.log(`  ${f.file}: ${f.error}`));
  }
  return { converted, alreadyUtf8, failed };
}

// ── CLI ─────────────────────────────────────────────

function parseArgs(argv) {
  const args = { mode: null, threshold: 0.8, file: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.mode = 'dry-run';
    else if (a === '--apply') args.mode = 'apply';
    else if (a === '--report') args.mode = 'report';
    else if (a === '--convert') args.mode = 'convert';
    else if (a === '--threshold') args.threshold = parseFloat(argv[++i]);
    else if (a === '--detect-encoding') args.mode = 'detect';
    else if (!args.file && !a.startsWith('--')) args.file = a;
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv);
  switch (args.mode) {
    case 'dry-run':
      dryRun(args.threshold);
      break;
    case 'apply':
      apply(args.threshold);
      break;
    case 'report':
      report();
      break;
    case 'convert':
      convertAll();
      break;
    case 'detect':
      detectSingle(args.file || path.join(KB_DIR, 'KB-20260621-001.md'));
      break;
    default:
      console.log('用法：');
      console.log('  node auto-classify.js --report');
      console.log('  node auto-classify.js --dry-run [--threshold 0.8]');
      console.log('  node auto-classify.js --apply [--threshold 0.8]');
      console.log('  node auto-classify.js --convert              # GB18030 → UTF-8');
      console.log('  node auto-classify.js --detect-encoding [file]');
      break;
  }
}

module.exports = {
  detectEncoding,
  decodeBuffer,
  parseKB,
  rebuildKB,
  classify,
  classifyOne,
  listKBFiles,
  report,
  dryRun,
  apply,
  convertToUTF8,
  convertAll,
  CLASSIFY_RULES,
  KB_DIR,
};
