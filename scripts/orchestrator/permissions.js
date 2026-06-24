#!/usr/bin/env node
/**
 * 权限骨架（v1.9 P1-3）
 *
 * 作用：
 *   - 最小权限模型（v1.9 占位实现，v2.0 完整版）
 *   - 角色：admin / user / readonly
 *   - 能力清单：每个能力声明 required roles
 *   - can(role, capability) 检查
 *
 * 用法：
 *   const { can, requireRole } = require('./permissions');
 *   if (!can(currentRole, 'snapshot.delete')) {
 *     throw new Error('权限不足');
 *   }
 *
 * 设计原则（v1.9 占位）：
 *   - 单一文件，零依赖
 *   - 当前用户角色默认从 env USER_ROLE 读取（生产环境需替换为认证系统）
 *   - 能力清单集中管理（新增能力必须在此登记）
 *
 * v2.0 升级：
 *   - 接入真实认证（OAuth / token）
 *   - 能力按模块分组（如 mcp.sqlite.write）
 *   - 审计日志联动（每次 deny 落 audit.jsonl）
 *
 * @since v1.9.0 (2026-06-24) P1-3
 */

const ROLES = ['admin', 'user', 'readonly'];

/**
 * 能力清单
 * 格式：capability -> { roles: [...], description }
 * 新增能力必须在此登记
 */
const CAPABILITIES = {
  // ===== 调度器 =====
  'dispatcher.decide':     { roles: ['admin', 'user', 'readonly'], description: '调用调度器决策' },
  'dispatcher.override':   { roles: ['admin'],                     description: '强制覆盖调度器决策' },

  // ===== 快照 =====
  'snapshot.save':         { roles: ['admin', 'user'],             description: '保存会话快照' },
  'snapshot.load':         { roles: ['admin', 'user', 'readonly'], description: '加载快照' },
  'snapshot.delete':       { roles: ['admin'],                     description: '删除快照' },
  'snapshot.config':       { roles: ['admin'],                     description: '修改快照模式全局配置' },
  'snapshot.session':      { roles: ['admin', 'user'],             description: '设置会话级快照模式' },

  // ===== 自我进化 =====
  'evolution.scan':        { roles: ['admin', 'user', 'readonly'], description: '扫描 GitHub 候选' },
  'evolution.analyze':     { roles: ['admin', 'user'],             description: '分析候选' },
  'evolution.implement':   { roles: ['admin'],                     description: '实现候选（创建分支、写代码、合并）' },
  'evolution.report':      { roles: ['admin', 'user', 'readonly'], description: '查看进化报告' },

  // ===== MCP 工具 =====
  'mcp.sqlite.read':       { roles: ['admin', 'user', 'readonly'], description: 'SQLite 读' },
  'mcp.sqlite.write':      { roles: ['admin', 'user'],             description: 'SQLite 写' },
  'mcp.fetch.public':      { roles: ['admin', 'user', 'readonly'], description: '抓取公网页' },
  'mcp.fetch.internal':    { roles: ['admin'],                     description: '抓取内网（需白名单）' },
  'mcp.filesystem.read':   { roles: ['admin', 'user', 'readonly'], description: '读工作空间文件' },
  'mcp.filesystem.write':  { roles: ['admin', 'user'],             description: '写工作空间文件' },

  // ===== 系统 =====
  'config.read':           { roles: ['admin', 'user', 'readonly'], description: '读配置' },
  'config.write':          { roles: ['admin'],                     description: '写配置' },
  'metrics.read':          { roles: ['admin', 'user', 'readonly'], description: '查看 metrics' },
  'logs.read':             { roles: ['admin', 'user', 'readonly'], description: '查看 logs' },
  'audit.read':            { roles: ['admin'],                     description: '查看审计日志' },
};

/**
 * 检查角色是否有能力
 * @param {string} role
 * @param {string} capability
 * @returns {boolean}
 */
function can(role, capability) {
  if (!ROLES.includes(role)) return false;
  const cap = CAPABILITIES[capability];
  if (!cap) return false;
  return cap.roles.includes(role);
}

/**
 * 抛出权限不足错误（带清晰消息）
 * @param {string} role
 * @param {string} capability
 * @throws {Error}
 */
function requireRole(role, capability) {
  if (!can(role, capability)) {
    const cap = CAPABILITIES[capability];
    const desc = cap ? cap.description : capability;
    const err = new Error(`权限不足: role="${role}" 不能执行 "${desc}"（${capability}）`);
    err.code = 'PERMISSION_DENIED';
    err.role = role;
    err.capability = capability;
    throw err;
  }
}

/**
 * 获取当前用户角色（v1.9 占位：env 读取，v2.0 接认证）
 * @returns {string}
 */
function currentRole() {
  return process.env.USER_ROLE || 'admin'; // v1.9 默认 admin 方便开发
}

/**
 * 列出某角色的所有能力
 * @param {string} role
 * @returns {string[]}
 */
function listCapabilities(role) {
  if (!ROLES.includes(role)) return [];
  return Object.entries(CAPABILITIES)
    .filter(([, cap]) => cap.roles.includes(role))
    .map(([name]) => name);
}

module.exports = {
  ROLES,
  CAPABILITIES,
  can,
  requireRole,
  currentRole,
  listCapabilities,
};

// ==================== CLI 自测 ====================
if (require.main === module) {
  console.log('=== 权限骨架自测 ===\n');

  // 1. can() 基本
  console.log('can("admin", "evolution.implement"):', can('admin', 'evolution.implement'), '(期望 true)');
  console.log('can("user", "evolution.implement"):', can('user', 'evolution.implement'), '(期望 false)');
  console.log('can("readonly", "mcp.sqlite.read"):', can('readonly', 'mcp.sqlite.read'), '(期望 true)');
  console.log('can("readonly", "mcp.sqlite.write"):', can('readonly', 'mcp.sqlite.write'), '(期望 false)');
  console.log('can("admin", "nonexistent"):', can('admin', 'nonexistent'), '(期望 false)');
  console.log('can("invalid", "snapshot.save"):', can('invalid', 'snapshot.save'), '(期望 false)');

  // 2. requireRole 抛错
  console.log('\nrequireRole("user", "evolution.implement"):');
  try {
    requireRole('user', 'evolution.implement');
    console.log('  ❌ 应抛错');
  } catch (e) {
    console.log('  ✅ 抛错:', e.message);
    console.log('  err.code:', e.code, '(期望 PERMISSION_DENIED)');
  }

  // 3. listCapabilities
  console.log('\nreadonly 角色的能力:');
  const caps = listCapabilities('readonly');
  console.log('  ', caps.join(', '));
  console.log('  数量:', caps.length);

  console.log('\nadmin 角色的能力:');
  const adminCaps = listCapabilities('admin');
  console.log('  数量:', adminCaps.length, '(应该 = 所有能力)');
  console.log('  总能力数:', Object.keys(CAPABILITIES).length);

  // 4. currentRole
  console.log('\ncurrentRole():', currentRole(), '(默认 admin)');
  process.env.USER_ROLE = 'readonly';
  console.log('currentRole() (env=readonly):', currentRole(), '(期望 readonly)');
  delete process.env.USER_ROLE;
}