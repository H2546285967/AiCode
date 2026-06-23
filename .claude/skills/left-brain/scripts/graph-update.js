#!/usr/bin/env node
/**
 * 知识图谱增量更新（v1.0 - 修复 JSON 转义问题）
 * 用法: node graph-update.js <new_id> <related_ids_comma_separated>
 *
 * 与 left-brain.sh 的 update_graph() 行为完全等价，
 * 但使用 JSON.stringify/parse 避免引号/换行损坏 graph.json。
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const KNOWLEDGE_DIR = path.join(MEMORY_DIR, 'knowledge');
const GRAPH_FILE = path.join(MEMORY_DIR, 'associations', 'graph.json');

const newId = process.argv[2];
const relatedIdsArg = process.argv[3] || '';

if (!newId) {
  console.error('用法: node graph-update.js <new_id> [related_ids,逗号分隔]');
  process.exit(1);
}

// 1. 读取 graph.json（缺失/损坏则重建）
let graph = { nodes: [], edges: [] };
if (fs.existsSync(GRAPH_FILE)) {
  try {
    const raw = fs.readFileSync(GRAPH_FILE, 'utf8');
    graph = JSON.parse(raw);
    if (!Array.isArray(graph.nodes)) graph.nodes = [];
    if (!Array.isArray(graph.edges)) graph.edges = [];
  } catch (e) {
    console.error(`⚠️ graph.json 损坏 (${e.message})，从 KB 文件重建`);
    // 触发重建逻辑
    const { execSync } = require('child_process');
    execSync(`node "${path.join(__dirname, 'rebuild-graph.js')}"`, { stdio: 'inherit' });
    graph = JSON.parse(fs.readFileSync(GRAPH_FILE, 'utf8'));
  }
}

// 2. 从 KB 文件读取 content/category
const kbFile = path.join(KNOWLEDGE_DIR, `${newId}.md`);
let content = '';
let category = '其他';
if (fs.existsSync(kbFile)) {
  const fm = fs.readFileSync(kbFile, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key === 'content') content = val.slice(0, 200);
      else if (key === 'category') category = val;
    }
  }
}

// 3. 添加节点（去重）
const existingNodeIds = new Set(graph.nodes.map(n => n.id));
if (!existingNodeIds.has(newId)) {
  graph.nodes.push({ id: newId, content, category });
  console.log(`  + 节点: ${newId}`);
} else {
  console.log(`  = 节点已存在: ${newId}`);
}

// 4. 添加边（去重）
const relatedIds = relatedIdsArg.split(',').map(s => s.trim()).filter(Boolean);
let addedEdges = 0;
for (const target of relatedIds) {
  if (!target || target === newId) continue;
  const exists = graph.edges.some(
    e => (e.source === newId && e.target === target) ||
         (e.source === target && e.target === newId)
  );
  if (!exists) {
    graph.edges.push({ source: newId, target, type: 'related' });
    addedEdges++;
  }
}
if (addedEdges > 0) {
  console.log(`  + 边: ${addedEdges} 条`);
}

// 5. 写回（保证 JSON 合法）
fs.writeFileSync(GRAPH_FILE, JSON.stringify(graph), 'utf8');
console.log(`✅ graph.json 已更新: ${graph.nodes.length} 节点, ${graph.edges.length} 边`);
