#!/usr/bin/env node
/**
 * 重建 graph.json — 遍历所有 KB-*.md，为每个条目创建节点，从 related 字段建立边
 * 用法: node rebuild-graph.js
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const KNOWLEDGE_DIR = path.join(MEMORY_DIR, 'knowledge');
const GRAPH_FILE = path.join(MEMORY_DIR, 'associations', 'graph.json');

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
    console.log('❌ 知识目录不存在');
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.startsWith('KB-') && f.endsWith('.md'))
    .sort();

  const nodes = new Map(); // id -> node
  const edgeSet = new Set(); // "source->target" dedup
  const edges = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    const id = fm.id || file.replace('.md', '');
    const category = fm.category || '其他';
    const nodeContent = (fm.content || '').slice(0, 200);
    const related = Array.isArray(fm.related) ? fm.related : [];

    // Create node
    if (!nodes.has(id)) {
      nodes.set(id, { id, content: nodeContent, category });
    }

    // Create edges from related
    for (const target of related) {
      if (!target || target === id) continue;
      const key1 = `${id}->${target}`;
      const key2 = `${target}->${id}`;
      if (!edgeSet.has(key1) && !edgeSet.has(key2)) {
        edgeSet.add(key1);
        edges.push({ source: id, target, type: 'related' });
      }
    }
  }

  const graph = {
    nodes: Array.from(nodes.values()),
    edges
  };

  fs.mkdirSync(path.dirname(GRAPH_FILE), { recursive: true });
  fs.writeFileSync(GRAPH_FILE, JSON.stringify(graph, null, 0), 'utf8');
  console.log(`✅ graph.json 已重建: ${nodes.size} 节点, ${edges.length} 边`);
  console.log(`   覆盖率: ${nodes.size}/${files.length} KB条目 (${Math.round(nodes.size / files.length * 100)}%)`);
}

main();
