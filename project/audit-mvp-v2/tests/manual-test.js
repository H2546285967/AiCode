// tests/manual-test.js
// 手动端到端验证：3 种 mock 场景
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

// 1x1 透明 PNG（用 ASCII 文件名避免 Windows 中文编码问题）
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(PNG_BASE64, 'base64');

const cases = [
  { filename: 'compliant-food.png', expectVerdict: 'pass' },
  { filename: 'violation-bad.png', expectVerdict: 'reject' },
  { filename: 'borderline-normal.png', expectVerdict: 'review' },
];

async function runOne({ filename, expectVerdict }) {
  // 写临时文件
  const tmpPath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(tmpPath, pngBuffer);

  // 上传
  const formData = new FormData();
  formData.append('file', new Blob([pngBuffer], { type: 'image/png' }), filename);
  formData.append('platform', 'douyin');
  const upRes = await fetch(`${BASE}/api/upload`, { method: 'POST', body: formData });
  const upData = await upRes.json();
  if (!upData.materialId) throw new Error('上传失败: ' + JSON.stringify(upData));

  // 审核
  const aRes = await fetch(`${BASE}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId: upData.materialId }),
  });
  const aData = await aRes.json();

  // 清理
  fs.unlinkSync(tmpPath);

  const ok = aData.report?.verdict === expectVerdict;
  const tag = ok ? '✅' : '❌';
  console.log(`${tag} ${filename.padEnd(28)} → ${aData.report?.verdict} · ${aData.riskScore}分 (预期 ${expectVerdict})`);
  return ok;
}

async function run() {
  console.log(`\n🧪 端到端测试：3 种 mock 场景\n`);
  let pass = 0, fail = 0;
  for (const c of cases) {
    if (await runOne(c)) pass++; else fail++;
  }
  console.log(`\n📊 ${pass}/3 通过 · ${fail}/3 失败\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run();