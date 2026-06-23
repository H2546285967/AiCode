#!/usr/bin/env node
/**
 * 重建 MEMORY.md 索引 — 扫描所有 KB-*.md 生成分类统计和索引
 * 用法: node rebuild-index.js
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const KNOWLEDGE_DIR = path.join(MEMORY_DIR, 'knowledge');
const MEMORY_MD = path.join(MEMORY_DIR, 'MEMORY.md');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
    fm[key] = val;
  }
  return fm;
}

function main() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.log('❌ 知识目录不存在:', KNOWLEDGE_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.startsWith('KB-') && f.endsWith('.md'))
    .sort();

  const entries = [];
  const categories = {};
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  let todayCount = 0;
  let weekCount = 0;
  let lastAccessed = '-';

  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    const id = fm.id || file.replace('.md', '');
    const category = fm.category || '其他';
    const learned = (fm.learned_at || '').slice(0, 10);
    const accessed = fm.last_accessed || '';

    entries.push({ id, category, content: fm.content || '', learned, accessed });

    if (!categories[category]) categories[category] = [];
    categories[category].push({ id, content: fm.content || '' });

    if (learned === todayStr) todayCount++;
    if (learned >= weekAgo) weekCount++;

    if (accessed > lastAccessed) lastAccessed = accessed;
  }

  // Build MEMORY.md
  const lines = [];
  lines.push('# 🧠 左脑知识索引');
  lines.push('');
  lines.push(`> 最后更新: ${todayStr}`);
  lines.push('');
  lines.push('## 📊 统计');
  lines.push('');
  lines.push(`- 知识总数: ${files.length}`);
  lines.push(`- 今日新增: ${todayCount}`);
  lines.push(`- 本周新增: ${weekCount}`);
  lines.push(`- 最后访问: ${lastAccessed || '-'}`);
  lines.push('');
  lines.push('## 📂 分类索引');
  lines.push('');

  const categoryOrder = ['人物', '项目', '技术', '决策', '偏好', '事件', '其他'];
  const categoryIcons = {
    '人物': '👤', '项目': '📁', '技术': '💻', '决策': '🎯',
    '偏好': '⭐', '事件': '📅', '其他': '📝'
  };

  for (const cat of categoryOrder) {
    const items = categories[cat];
    if (!items || items.length === 0) continue;
    lines.push(`### ${categoryIcons[cat] || '📝'} ${cat} (${items.length})`);
    lines.push('');
    for (const item of items) {
      lines.push(`- **${item.id}**: ${item.content.slice(0, 80)}`);
    }
    lines.push('');
  }

  // Categories not in predefined order
  for (const [cat, items] of Object.entries(categories)) {
    if (categoryOrder.includes(cat)) continue;
    lines.push(`### ${categoryIcons[cat] || '📝'} ${cat} (${items.length})`);
    lines.push('');
    for (const item of items) {
      lines.push(`- **${item.id}**: ${item.content.slice(0, 80)}`);
    }
    lines.push('');
  }

  lines.push('## 📝 最近 10 条');
  lines.push('');
  const recent = entries.slice(-10).reverse();
  for (const item of recent) {
    lines.push(`- **${item.id}** (${item.learned}): ${item.content.slice(0, 60)}`);
  }
  lines.push('');

  fs.writeFileSync(MEMORY_MD, lines.join('\n'), 'utf8');
  console.log(`✅ MEMORY.md 已重建: ${files.length} 条知识, ${Object.keys(categories).length} 个分类`);
}

main();
