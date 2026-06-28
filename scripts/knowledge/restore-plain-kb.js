#!/usr/bin/env node
/**
 * restore-plain-kb.js — 把被 enrich-kb 错误破坏的 20 条 KB 恢复回纯文本格式
 *
 * 已知问题：KB-20260622-004.md 等 18 条 + KB-20260624-002.md + KB-20260625-001/002/003.md
 *           enrich 时 content 字段被截断（regex 没正确匹配）
 *
 * 修复策略：从备份 knowledge.bak-20260629/ 还原这 20 条原始纯文本
 *           + 重新 enrich（修复 regex 后）
 *
 * @since v3.0.5 (2026-06-29) — M45 紧急修复
 */

const fs = require('fs');
const path = require('path');

const KB_DIR = path.join(__dirname, '..', '..', '.claude', 'skills', 'left-brain', 'memory', 'knowledge');
const BAK_DIR = path.join(__dirname, '..', '..', '.claude', 'skills', 'left-brain', 'memory', 'knowledge.bak-20260629');

// 已知被破坏的文件（enrich 产生但 content 字段异常）
const BROKEN_FILES = [
  'KB-20260622-004.md', 'KB-20260622-005.md', 'KB-20260622-006.md', 'KB-20260622-007.md',
  'KB-20260622-008.md', 'KB-20260622-009.md', 'KB-20260622-011.md', 'KB-20260622-012.md',
  'KB-20260622-013.md', 'KB-20260622-014.md', 'KB-20260622-015.md', 'KB-20260622-016.md',
  'KB-20260622-017.md', 'KB-20260622-018.md', 'KB-20260622-019.md', 'KB-20260622-020.md',
  'KB-20260624-002.md', 'KB-20260625-001.md', 'KB-20260625-002.md', 'KB-20260625-003.md',
];

function restore() {
  if (!fs.existsSync(BAK_DIR)) {
    console.error(`❌ 备份不存在: ${BAK_DIR}`);
    process.exit(1);
  }
  let restored = 0;
  let missing = 0;
  for (const filename of BROKEN_FILES) {
    const bak = path.join(BAK_DIR, filename);
    const dest = path.join(KB_DIR, filename);
    if (!fs.existsSync(bak)) {
      console.log(`⚠️  备份缺失: ${filename}`);
      missing++;
      continue;
    }
    fs.copyFileSync(bak, dest);
    restored++;
    console.log(`🔄 ${filename}`);
  }
  console.log('');
  console.log(`📊 恢复结果：${restored} 条${missing ? ' / 缺失 ' + missing + ' 条' : ''}`);
  return { restored, missing };
}

if (require.main === module) {
  restore();
}

module.exports = { restore, BROKEN_FILES };