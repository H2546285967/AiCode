// src/db.js
// SQLite 初始化 + 2 张表（materials + audit_logs）
// 数据模型来源于：H:\AI-han\AiCode\project\一、系统架构总览.md §3.2
// 存储：Node.js 22+ 内置 node:sqlite（零依赖、零编译）

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'audit.db');

// 确保 data 目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// node:sqlite 是同步 API（与 better-sqlite3 几乎一致）
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// 初始化表结构（参考方案文档，砍掉 campaign_data + audit_policies）
db.exec(`
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform VARCHAR(20) NOT NULL DEFAULT 'douyin',
    material_type VARCHAR(20) NOT NULL,
    source_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    title VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    risk_score INTEGER,
    ai_result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    stage VARCHAR(20) NOT NULL,
    result VARCHAR(20) NOT NULL,
    confidence FLOAT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_material ON audit_logs(material_id);
`);

/**
 * 插入素材记录
 */
export function insertMaterial({ platform, materialType, sourceFilename, filePath, fileSize, mimeType, title }) {
  const stmt = db.prepare(`
    INSERT INTO materials (platform, material_type, source_filename, file_path, file_size, mime_type, title, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const info = stmt.run(platform, materialType, sourceFilename, filePath, fileSize, mimeType, title || null);
  return Number(info.lastInsertRowid);
}

/**
 * 更新素材审核结果
 */
export function updateMaterialResult(id, { status, riskScore, aiResult }) {
  const stmt = db.prepare(`
    UPDATE materials
    SET status = ?, risk_score = ?, ai_result = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(status, riskScore, JSON.stringify(aiResult), id);
}

/**
 * 写审核日志
 */
export function insertAuditLog({ materialId, stage, result, confidence, details }) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (material_id, stage, result, confidence, details)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(materialId, stage, result, confidence, JSON.stringify(details || {}));
}

/**
 * 查询素材列表
 */
export function listMaterials({ limit = 20, offset = 0 } = {}) {
  return db.prepare(`
    SELECT id, platform, material_type, source_filename, status, risk_score, created_at
    FROM materials
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

/**
 * 查询素材详情
 */
export function getMaterial(id) {
  return db.prepare(`SELECT * FROM materials WHERE id = ?`).get(id);
}

export function getAuditLogs(materialId) {
  return db.prepare(`
    SELECT * FROM audit_logs WHERE material_id = ? ORDER BY created_at ASC
  `).all(materialId);
}

console.log(`[db] SQLite initialized at ${DB_PATH}`);