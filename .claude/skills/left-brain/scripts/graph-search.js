#!/usr/bin/env node
/**
 * 图谱搜索 — 2-hop 关联扩散
 * 用法: node graph-search.js <id1> [id2] [id3] ...
 * 输出: 每行一个关联 ID，格式 "hop1|id" 或 "hop2|id"
 */

const fs = require('fs');
const path = require('path');

const GRAPH_FILE = path.join(__dirname, '..', 'memory', 'associations', 'graph.json');
const KNOWLEDGE_DIR = path.join(__dirname, '..', 'memory', 'knowledge');

function main() {
  const seedIds = process.argv.slice(2);
  if (seedIds.length === 0) {
    process.exit(0);
  }

  if (!fs.existsSync(GRAPH_FILE)) {
    process.exit(0);
  }

  const graph = JSON.parse(fs.readFileSync(GRAPH_FILE, 'utf8'));

  // Build adjacency list
  const adj = new Map();
  for (const edge of graph.edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.source).push(edge.target);
    adj.get(edge.target).push(edge.source);
  }

  const seen = new Set(seedIds);
  const results = [];

  // Hop 1
  const hop1 = [];
  for (const id of seedIds) {
    const neighbors = adj.get(id) || [];
    for (const n of neighbors) {
      if (!seen.has(n)) {
        seen.add(n);
        hop1.push(n);
        results.push({ hop: 1, id: n });
      }
    }
  }

  // Hop 2
  for (const id of hop1) {
    const neighbors = adj.get(id) || [];
    for (const n of neighbors) {
      if (!seen.has(n)) {
        seen.add(n);
        results.push({ hop: 2, id: n });
      }
    }
  }

  // Output
  for (const r of results) {
    const kbFile = path.join(KNOWLEDGE_DIR, `${r.id}.md`);
    let content = '';
    try {
      const md = fs.readFileSync(kbFile, 'utf8');
      const match = md.match(/^content:\s*(.+)$/m);
      if (match) content = match[1].slice(0, 100);
    } catch { /* file not found */ }
    console.log(`${r.hop}|${r.id}|${content}`);
  }
}

main();
