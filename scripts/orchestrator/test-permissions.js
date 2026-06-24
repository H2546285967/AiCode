#!/usr/bin/env node
/**
 * permissions 单元测试（v1.9 P1-3）
 *
 * 覆盖：
 *   1. can() 对 3 角色 × 各种能力的行为
 *   2. requireRole 抛错
 *   3. listCapabilities 返回正确数量
 *   4. currentRole 从 env 读取
 *   5. 未知能力 / 未知角色拒绝
 *
 * @since v1.9.0 (2026-06-24) P1-3
 */

const {
  ROLES, CAPABILITIES, can, requireRole, currentRole, listCapabilities,
} = require('./permissions');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}

// 1. can() 各角色
check('admin 能 evolution.implement', can('admin', 'evolution.implement'));
check('user 不能 evolution.implement', !can('user', 'evolution.implement'));
check('readonly 不能 evolution.implement', !can('readonly', 'evolution.implement'));
check('readonly 能 mcp.sqlite.read', can('readonly', 'mcp.sqlite.read'));
check('readonly 不能 mcp.sqlite.write', !can('readonly', 'mcp.sqlite.write'));
check('user 能 snapshot.save', can('user', 'snapshot.save'));
check('user 不能 snapshot.delete', !can('user', 'snapshot.delete'));
check('admin 能 snapshot.delete', can('admin', 'snapshot.delete'));
check('user 能 dispatcher.decide', can('user', 'dispatcher.decide'));
check('readonly 能 dispatcher.decide', can('readonly', 'dispatcher.decide'));

// 2. 未知能力 / 角色
check('未知能力拒绝', !can('admin', 'fake.capability'));
check('未知角色拒绝', !can('superuser', 'snapshot.save'));
check('空角色拒绝', !can('', 'snapshot.save'));

// 3. requireRole 抛错
let denied = false;
try { requireRole('user', 'evolution.implement'); }
catch (e) {
  denied = e.code === 'PERMISSION_DENIED' && e.role === 'user' && e.capability === 'evolution.implement';
}
check('requireRole 抛 PERMISSION_DENIED + 含元信息', denied);

// 4. requireRole 通过不抛
let passed4 = true;
try { requireRole('admin', 'evolution.implement'); }
catch { passed4 = false; }
check('admin 通过 requireRole 不抛', passed4);

// 5. listCapabilities
const readonlyCaps = listCapabilities('readonly');
const userCaps = listCapabilities('user');
const adminCaps = listCapabilities('admin');
check('admin 能力数 = 总能力数', adminCaps.length === Object.keys(CAPABILITIES).length);
check('readonly 能力 < user 能力', readonlyCaps.length < userCaps.length);
check('user 能力 < admin 能力', userCaps.length < adminCaps.length);
check('readonly 能力均不含 evolution.implement', !readonlyCaps.includes('evolution.implement'));

// 6. currentRole 默认 admin
delete process.env.USER_ROLE;
check('currentRole 默认 admin', currentRole() === 'admin');
process.env.USER_ROLE = 'readonly';
check('env=readonly 时 currentRole 返回 readonly', currentRole() === 'readonly');
process.env.USER_ROLE = 'user';
check('env=user 时 currentRole 返回 user', currentRole() === 'user');
delete process.env.USER_ROLE;

// 7. ROLES 完整性
check('ROLES 含 admin/user/readonly', ROLES.includes('admin') && ROLES.includes('user') && ROLES.includes('readonly'));

console.log('');
console.log(`📊 permissions 测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
process.exit(failed > 0 ? 1 : 0);