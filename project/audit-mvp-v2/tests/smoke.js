// tests/smoke.js
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const PORT = 3333;
const BASE = `http://localhost:${PORT}`;

let serverProcess = null;
let passed = 0, failed = 0, skipped = 0;
const USE_MOCK = !process.env.KIMI_API_KEY || process.env.USE_MOCK === 'true';

function log(emoji, label, msg = '') {
  console.log(`${emoji} ${label.padEnd(40)} ${msg}`);
}
const pass = (l, m) => { passed++; log('✅', l, m); };
const fail = (l, m) => { failed++; log('❌', l, m); };
const skip = (l, m) => { skipped++; log('⏭️ ', l, m); };

async function startServer() {
  console.log(`\n🚀 启动测试服务（端口 ${PORT}）...`);
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), USE_MOCK: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error('服务启动超时');
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await sleep(500);
  }
}

async function test1_health() {
  const res = await fetch(`${BASE}/api/health`);
  const data = await res.json();
  if (data.status === 'ok') pass('1. 健康检查', data.mode);
  else fail('1. 健康检查', JSON.stringify(data));
}

async function test2_static() {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  if (html.includes('AI 素材审核')) pass('2. 静态页面');
  else fail('2. 静态页面', '未找到预期内容');
}

async function test3_upload() {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108020000009077532de00000000c49444154789c636060000000040000019d4f5d650000000049454e44ae426082', 'hex');
  const formData = new FormData();
  formData.append('file', new Blob([png], { type: 'image/png' }), '合规测试.png');
  formData.append('platform', 'douyin');

  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: formData });
  const data = await res.json();

  if (res.ok && data.materialId) { pass('3. 文件上传', `#${data.materialId}`); return data.materialId; }
  else { fail('3. 文件上传', JSON.stringify(data)); return null; }
}

async function test4_audit(materialId) {
  if (!materialId) return skip('4. AI 审核', '无 materialId');
  if (!USE_MOCK) return skip('4. AI 审核', '需真实 KIMI_API_KEY');

  const res = await fetch(`${BASE}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId }),
  });
  const data = await res.json();
  if (res.ok && data.report?.verdict) pass(`4. AI 审核`, `${data.report.verdict} · ${data.riskScore}分`);
  else fail('4. AI 审核', JSON.stringify(data));
}

async function test5_list() {
  const res = await fetch(`${BASE}/api/materials`);
  const data = await res.json();
  if (res.ok && Array.isArray(data.items)) pass('5. 列表查询', `${data.count} 条`);
  else fail('5. 列表查询', JSON.stringify(data));
}

async function run() {
  try {
    await startServer();
    await test1_health();
    await test2_static();
    const materialId = await test3_upload();
    await test4_audit(materialId);
    await test5_list();
  } catch (err) {
    console.error('\n💥 异常:', err.message);
    failed++;
  } finally {
    await stopServer();
  }
  console.log(`\n📊 测试结果: ✅ ${passed} 通过 · ❌ ${failed} 失败 · ⏭️  ${skipped} 跳过\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();