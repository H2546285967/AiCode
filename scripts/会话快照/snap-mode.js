#!/usr/bin/env node
/**
 * 快照模式管理（v1.0）
 * 用法:
 *   node snap-mode.js                      # 显示当前模式
 *   node snap-mode.js off                  # 切换到 off
 *   node snap-mode.js manual
 *   node snap-mode.js milestone
 *   node snap-mode.js auto
 *   node snap-mode.js reset                # 清掉会话覆盖，回到全局配置
 *   node snap-mode.js --status             # 详细状态（含来源）
 *
 * 会话级覆盖文件: .claude/session-snap-mode.json
 * 优先级: session 覆盖 > snapshot-config.json > 默认 milestone
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SESSION_FILE = path.join(ROOT, '.claude', 'session-snap-mode.json');
const CONFIG_FILE = path.join(ROOT, '.claude', 'snapshot-config.json');
const VALID_MODES = ['off', 'manual', 'milestone', 'auto'];
const DEFAULT_MODE = 'milestone';

function readCurrentMode() {
  // 1. session 覆盖
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const s = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      if (s && VALID_MODES.includes(s.mode)) {
        return { mode: s.mode, source: 'session-snap-mode.json', setAt: s.setAt, setBy: s.setBy };
      }
    }
  } catch (e) {}
  // 2. 全局配置
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const c = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (c && VALID_MODES.includes(c.mode)) {
        return { mode: c.mode, source: 'snapshot-config.json', setAt: null, setBy: null };
      }
    }
  } catch (e) {}
  return { mode: DEFAULT_MODE, source: 'default', setAt: null, setBy: null };
}

function writeSessionOverride(mode) {
  const data = {
    mode,
    setAt: new Date().toISOString(),
    setBy: '/snap-mode',
  };
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function clearSessionOverride() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

const args = process.argv.slice(2);
const cmd = args[0];

if (args.includes('--status') || (!cmd && args.length === 0)) {
  const cur = readCurrentMode();
  console.log('📸 当前快照模式');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  模式:    ${cur.mode}`);
  console.log(`  来源:    ${cur.source}`);
  if (cur.setAt) console.log(`  设置于:  ${cur.setAt}`);
  if (cur.setBy) console.log(`  设置者:  ${cur.setBy}`);
  console.log('');
  console.log('  可用模式:');
  console.log('    off        关闭自动保存（手动 save.js 仍可用）');
  console.log('    manual     只有显式 save.js 才保存');
  console.log('    milestone  命中完成/里程碑关键词时保存');
  console.log('    auto       每次 Stop hook 都保存');
  console.log('');
  console.log('  操作:');
  console.log('    /snap-mode off     切到 off');
  console.log('    /snap-mode reset   清除会话覆盖');
  process.exit(0);
}

if (cmd === 'reset') {
  clearSessionOverride();
  const cur = readCurrentMode();
  console.log(`🔄 会话覆盖已清除，当前模式: ${cur.mode} (来源: ${cur.source})`);
  process.exit(0);
}

if (VALID_MODES.includes(cmd)) {
  writeSessionOverride(cmd);
  console.log(`✅ 模式已切换: ${cmd}`);
  console.log(`   作用域: 本次会话（写入 ${path.relative(ROOT, SESSION_FILE)}）`);
  console.log(`   全局 snapshot-config.json 未改动`);
  console.log('');
  if (cmd === 'off') {
    console.log('   ℹ️ 自动快照已关闭。需要手动保存时：');
    console.log('     node scripts/会话快照/save.js "标题" "标签"');
  } else if (cmd === 'manual') {
    console.log('   ℹ️ Stop hook 自动保存已关闭，只有显式 save.js 才保存');
  } else if (cmd === 'milestone') {
    console.log('   ℹ️ 标签含"完成/里程碑/交付"等关键词时自动保存');
  } else if (cmd === 'auto') {
    console.log('   ℹ️ 每次会话结束都会自动保存');
  }
  console.log('');
  console.log(`   查看当前: /snap-mode  或  /snap-mode --status`);
  console.log(`   切回默认: /snap-mode reset`);
  process.exit(0);
}

console.error(`❌ 未知模式: "${cmd}"`);
console.error(`   有效模式: ${VALID_MODES.join(', ')}, reset`);
process.exit(1);
