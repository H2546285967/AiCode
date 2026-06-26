#!/usr/bin/env node
/**
 * test-skills.js — skill 元数据验证（M25 v3.0.5）
 *
 * 验证：
 *   - .claude/skills/ 下每个 skill 都有合法 YAML frontmatter
 *   - 必须包含 name + description 字段
 *   - name 必须唯一
 *   - 文件大小 > 500 字节（避免空壳）
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '..', '.claude', 'skills');

let pass = 0, fail = 0;
const fails = [];

function check(name, cond, detail) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; fails.push(name); console.log(`❌ ${name}${detail ? '  → ' + detail : ''}`); }
}

console.log('━'.repeat(60));
console.log('🧪 skill 元数据验证（M25 · v3.0.5）');
console.log('━'.repeat(60));

// 1. skills 目录存在
check('skills 目录存在', fs.existsSync(SKILLS_DIR));

// 2. 找出所有 SKILL.md
const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log(`\n── 发现 ${skillDirs.length} 个 skill 目录 ──`);

// 3. 每个 skill 必须有 SKILL.md
console.log('\n── 1. SKILL.md 存在 ──');
skillDirs.forEach(name => {
  const skillPath = path.join(SKILLS_DIR, name, 'SKILL.md');
  check(`skill/${name} 有 SKILL.md`, fs.existsSync(skillPath));
});

// 4. 解析 frontmatter
console.log('\n── 2. frontmatter 解析 ──');
const skillsData = {};

skillDirs.forEach(name => {
  const skillPath = path.join(SKILLS_DIR, name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return;
  const content = fs.readFileSync(skillPath, 'utf8');

  // 提取 --- ... --- 之间的 YAML
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    check(`skill/${name} 有 frontmatter`, false, '未找到 --- 分隔符');
    return;
  }
  const yaml = match[1];

  // 提取 name
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  const fmName = nameMatch ? nameMatch[1].trim() : null;
  check(`skill/${name} frontmatter 含 name`, !!fmName, fmName ? `name=${fmName}` : '未找到');

  // 提取 description（支持多行折叠 YAML `>`）
  let fmDesc = null;
  const descBlock = yaml.match(/^description:\s*(?:>\s*)?\n([\s\S]+?)(?=^[a-zA-Z]|\Z)/m);
  if (descBlock) {
    // 折叠多行：去掉每行开头缩进，拼成单行
    fmDesc = descBlock[1].split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
  } else {
    // 单行 description: xxx
    const descMatch = yaml.match(/^description:\s*(.+)$/m);
    if (descMatch) fmDesc = descMatch[1].trim();
  }
  check(`skill/${name} frontmatter 含 description`, !!fmDesc);

  // 文件大小
  const size = fs.statSync(skillPath).size;
  check(`skill/${name} 大小 > 500 字节`, size > 500, `size=${size}`);

  skillsData[name] = { name: fmName, desc: fmDesc, size, path: skillPath };
});

// 5. name 唯一性
console.log('\n── 3. name 唯一性 ──');
const names = Object.values(skillsData).map(s => s.name).filter(Boolean);
const nameSet = new Set(names);
check('所有 skill name 唯一', names.length === nameSet.size,
  names.length === nameSet.size ? '' : `重复: ${names.filter(n => names.filter(x => x === n).length > 1).join(', ')}`);

// 6. 必填字段完整性
console.log('\n── 4. 必填字段 ──');
skillDirs.forEach(name => {
  const data = skillsData[name];
  if (!data) return;
  // description 不能是占位符
  check(`skill/${name} description 非空且 > 20 字符`,
    data.desc && data.desc.length > 20,
    `desc.length=${data.desc ? data.desc.length : 0}`);
});

// 总结
console.log('\n' + '━'.repeat(60));
console.log(`📊 skill 验证结果: ${pass} 通过 / ${fail} 失败`);
console.log('━'.repeat(60));

if (fail > 0) {
  console.log('\n❌ 失败项:');
  fails.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}

console.log('\n🎉 所有 skill 元数据合法');
console.log(`\n发现 ${skillDirs.length} 个 skill: ${skillDirs.join(', ')}`);
process.exit(0);