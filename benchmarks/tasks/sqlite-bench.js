#!/usr/bin/env node
/**
 * Benchmark 任务：SQLite 操作
 * 插入 1000 条记录，再查询
 */

const sqlite = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || path.join(__dirname, '..', '..', '.tmp');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const dbPath = path.join(dir, 'bench.db');
const db = new sqlite.DatabaseSync(dbPath);

db.exec('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, value TEXT)');

const insert = db.prepare('INSERT INTO items (value) VALUES (?)');
for (let i = 0; i < 1000; i++) {
  insert.run(`value-${i}`);
}

const rows = db.prepare('SELECT COUNT(*) as cnt FROM items').get();
console.log(`sqlite-bench: ${rows.cnt} rows`);

db.close();
