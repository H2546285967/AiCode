#!/usr/bin/env node

/**
 * utils.js — workflow 子系统的公共常量与工具函数
 *
 * 设计：抽离 pattern-miner.js / suggestion-engine.js / workflow-observer.js 三文件
 * 重复的路径常量与基础工具函数，遵循 DRY 原则。
 *
 * 抽取范围（v3.0.8 P1-001）：
 *   路径：WORKSPACE_ROOT / SKILL_DIR / MEMORY_DIR / EVENTS_FILE / PATTERNS_FILE
 *   工具：ensureDir
 *
 * 不抽取的范围：
 *   - execSafe（只 suggestion-engine.js 用）
 *   - readFileSafe / loadJsonSafe（各自实现不同，强行抽会引入歧义）
 *   - DEFAULT_* 阈值（pattern-miner.js 独有）
 *   - loadObserver / loadMiner（处理循环引用，需在调用方处理）
 *
 * 使用：
 *   const { WORKSPACE_ROOT, EVENTS_FILE, ensureDir } = require('./utils');
 */

const fs = require('fs');
const path = require('path');

// ── 路径常量 ─────────────────────────────────────────────

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const SKILL_DIR = path.join(WORKSPACE_ROOT, '.claude', 'skills', 'left-brain');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');

// events 文件支持 env 覆盖（测试隔离必须）
const EVENTS_FILE = process.env.WORKFLOW_EVENTS_FILE
  ? path.resolve(process.env.WORKFLOW_EVENTS_FILE)
  : path.join(MEMORY_DIR, 'workflow-events.jsonl');

const PATTERNS_FILE = process.env.WORKFLOW_PATTERNS_FILE
  ? path.resolve(process.env.WORKFLOW_PATTERNS_FILE)
  : path.join(MEMORY_DIR, 'workflow-patterns.json');

// ── 工具函数 ─────────────────────────────────────────────

/**
 * 确保目录存在（不存在则 mkdir -p）
 * @param {string} dir
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 安全读文件（不存在/权限错则返回 null）
 * @param {string} fp
 * @returns {string|null}
 */
function readFileSafe(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch {
    return null;
  }
}

module.exports = {
  // 路径常量
  WORKSPACE_ROOT,
  SKILL_DIR,
  MEMORY_DIR,
  EVENTS_FILE,
  PATTERNS_FILE,
  // 工具
  ensureDir,
  readFileSafe,
};
