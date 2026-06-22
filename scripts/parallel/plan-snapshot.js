#!/usr/bin/env node
/**
 * 计划快照 —— 三级检查点的阶段 1
 *
 * 用法: node plan-snapshot.js "<任务标题>" "[任务描述]" "[mermaid 图]" "[文件列表]"
 *
 * 输出: .claude/snapshots/plan-<时间戳>-<任务名>.md
 *
 * 在做任务开始前调用，保存方案、图表、文件路径。
 * 之后 worker 完成时 save.js 迭代快照。
 * 全部完成后 global-archive.sh 全局归档。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SNAPSHOT_DIR = path.join(ROOT, '.claude', 'snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

const title = process.argv[2] || '未命名任务';
const description = process.argv[3] || '（无描述）';
const mermaid = process.argv[4] || 'graph TD\n  A[开始] --> B[完成]';
const filesCsv = process.argv[5] || '';  // 逗号分隔的文件路径列表

const now = new Date();
const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString().substring(0, 19).replace('T', ' ');
const timestamp = localISO.replace(/[: ]/g, '-');
const safeTitle = title.replace(/[\\/:*?"<>+]/g, '-').substring(0, 30);

const filename = `plan-${timestamp}-${safeTitle}.md`;
const filepath = path.join(SNAPSHOT_DIR, filename);

// 文件列表
const fileList = filesCsv.split(',').map(f => f.trim()).filter(Boolean);
const fileTable = fileList.length > 0
  ? fileList.map(f => `- [ ] \`${f}\``).join('\n')
  : '_（未指定文件）_';

const content = `---
level: plan
task: ${title}
created: ${localISO}
status: pending
---

# 📋 计划快照：${title}

**创建时间**：${localISO}
**任务状态**：⏳ 待开始
**级别**：1/3（计划 → 迭代 → 全局归档）

---

## 📝 任务描述

${description}

---

## 🗺️ 任务图（Mermaid）

\`\`\`mermaid
${mermaid}
\`\`\`

---

## 📁 涉及文件清单

${fileTable}

---

## 🎯 验收标准

- [ ] 所有计划文件已修改/创建
- [ ] 相关测试通过
- [ ] worker 数量 = 计划数量

---

## 🔗 关联

- 下一步：每个 worker 完成后跑 \`node scripts/会话快照/save.js "<任务名>" "<标签>"\`
- 全部完成后跑：\`bash scripts/parallel/global-archive.sh "${title}"\`

---

_本快照由 scripts/parallel/plan-snapshot.js 自动生成_
`;

fs.writeFileSync(filepath, content, 'utf8');
console.log(`✅ 计划快照已保存: ${filename}`);
console.log(`   位置: ${filepath}`);