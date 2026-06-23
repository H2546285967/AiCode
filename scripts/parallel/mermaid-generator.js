#!/usr/bin/env node
/**
 * Mermaid 任务流图生成器
 *
 * 解析 snapshots-index.md 表格，生成 Mermaid `graph LR` 图
 * 展示：开始 → 计划 → 迭代序列 → 归档
 *
 * 用法：
 *   node mermaid-generator.js <snapshots-index.md> <输出.mmd>
 *
 * 输出格式（Mermaid）：
 *   graph LR
 *     A[开始: XXX] --> B[计划: XXX]
 *     B --> C[迭代1: XXX]
 *     C --> D[迭代2: XXX]
 *     D --> E[归档]
 *
 * @since v1.6.0 (2026-06-22) Tier 1 改造 T1.3
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析 snapshots-index.md 表格
 * 格式：
 *   | 级别 | 时间 | 文件 | 标题 |
 *   |:-----|:-----|:-----|:-----|
 *   | 计划 | 2026-06-22 13:00 | `plan-xxx.md` | 标题 |
 *   | 迭代 | 2026-06-22 14:00 | `iter-xxx.md` | 标题 |
 */
function parseIndex(content) {
  const lines = content.split('\n');
  const rows = [];
  let inTable = false;
  let headerSkipped = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.includes('级别')) {
      inTable = true;
      continue;  // 跳表头
    }
    if (inTable && trimmed.startsWith('|:')) {
      continue;  // 跳分隔符
    }
    if (inTable && trimmed.startsWith('|')) {
      // 分割 | 单元格
      const cells = trimmed.split('|').map(s => s.trim()).filter(Boolean);
      if (cells.length >= 4) {
        rows.push({
          level: cells[0],
          time: cells[1],
          file: cells[2].replace(/`/g, ''),
          title: cells[3],
        });
      }
    } else if (inTable && trimmed === '') {
      // 空行 → 表结束
      break;
    }
  }
  return rows;
}

/**
 * 清理 Mermaid 节点文本（去除特殊字符）
 * Mermaid 节点 ID 必须是字母数字下划线，label 可含空格但要避免 `[]` 等
 */
function sanitize(text) {
  return text
    .replace(/[<>{}|]/g, '')  // 移除 Mermaid 保留字符
    .replace(/[:"]/g, '')      // 移除冒号引号
    .substring(0, 50);          // 截断长标题
}

/**
 * 生成 Mermaid graph LR 代码
 */
function generateMermaid(rows, taskName) {
  if (rows.length === 0) {
    return `graph LR\n  A[${sanitize(taskName)}] --> B[无快照数据]\n`;
  }

  const lines = ['graph LR'];
  // 开始节点
  lines.push(`  start([开始: ${sanitize(taskName)}])`);

  let prevId = 'start';
  rows.forEach((row, i) => {
    const id = `n${i}`;
    const label = `${row.level}\\n${row.time}\\n${sanitize(row.title)}`;
    lines.push(`  ${id}["${label}"]`);
    lines.push(`  ${prevId} --> ${id}`);
    prevId = id;
  });

  // 归档节点
  lines.push(`  end([归档完成])`);
  lines.push(`  ${prevId} --> end`);

  // 给计划节点加特殊样式（圆角）
  rows.forEach((row, i) => {
    if (row.level === '计划') {
      lines.push(`  style n${i} fill:#e1f5e1,stroke:#2e7d32`);
    }
  });
  // 给归档节点样式
  lines.push(`  style end fill:#fff3e0,stroke:#e65100`);

  return lines.join('\n') + '\n';
}

// ==================== CLI 入口 ====================

if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3];
  const taskName = process.argv[4] || '任务';

  if (!input || !output) {
    console.error('用法: node mermaid-generator.js <snapshots-index.md> <输出.mmd> [任务名]');
    process.exit(1);
  }

  if (!fs.existsSync(input)) {
    console.error(`[mermaid] 输入文件不存在: ${input}`);
    process.exit(1);
  }

  const content = fs.readFileSync(input, 'utf8');
  const rows = parseIndex(content);
  const mermaid = generateMermaid(rows, taskName);

  // 确保输出目录存在
  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(output, mermaid);

  console.log(`[mermaid] ✅ 任务流图已生成: ${output}`);
  console.log(`[mermaid]    节点数: ${rows.length}（含开始/结束共 ${rows.length + 2}）`);
}

module.exports = { parseIndex, generateMermaid };
