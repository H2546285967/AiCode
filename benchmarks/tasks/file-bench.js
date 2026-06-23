#!/usr/bin/env node
/**
 * Benchmark 任务：文件操作
 * 创建 100 个文件，再读取全部
 */

const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || path.join(__dirname, '..', '.tmp');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const count = 100;
for (let i = 0; i < count; i++) {
  fs.writeFileSync(path.join(dir, `file-${i}.txt`), `content-${i}`.repeat(100));
}

let total = 0;
for (let i = 0; i < count; i++) {
  const content = fs.readFileSync(path.join(dir, `file-${i}.txt`), 'utf8');
  total += content.length;
}

console.log(`file-bench: ${count} files, ${total} chars`);
