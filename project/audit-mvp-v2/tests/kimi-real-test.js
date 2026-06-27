// tests/kimi-real-test.js
// 真实 Kimi API 端到端测试
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const PORT = process.env.PORT || 3000;
const BASE = `http://localhost:${PORT}`;

// 1x1 PNG
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(PNG_BASE64, 'base64');

async function run() {
  console.log(`\n🧪 真实 Kimi API 验证\n`);

  // 写临时文件
  const tmpPath = path.join(UPLOAD_DIR, 'kimi-test.png');
  fs.writeFileSync(tmpPath, pngBuffer);

  // 上传
  console.log('📤 上传素材...');
  const formData = new FormData();
  formData.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'kimi-test.png');
  formData.append('platform', 'douyin');
  const upRes = await fetch(`${BASE}/api/upload`, { method: 'POST', body: formData });
  const upData = await upRes.json();
  if (!upData.materialId) throw new Error('上传失败: ' + JSON.stringify(upData));
  console.log(`   ✅ materialId = ${upData.materialId}`);

  // 审核
  console.log('🤖 调用 Kimi 审核（可能 5-30 秒）...');
  const start = Date.now();
  const aRes = await fetch(`${BASE}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId: upData.materialId }),
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const aData = await aRes.json();

  // 清理
  fs.unlinkSync(tmpPath);

  if (!aRes.ok) {
    console.log(`\n❌ 失败（${elapsed}秒）：${aData.error || JSON.stringify(aData)}`);
    process.exit(1);
  }

  if (!aData.report) {
    console.log(`\n❌ 返回无 report：${JSON.stringify(aData)}`);
    process.exit(1);
  }

  console.log(`\n✅ Kimi 审核成功！耗时 ${elapsed} 秒\n`);
  console.log(`📊 综合评分：${aData.riskScore} (${aData.report.verdict})`);
  console.log(`💡 理由：${aData.report.reasoning}`);
  console.log(`\n📋 4 维度评分：`);
  const labels = { compliance: '合规性', brand_safety: '品牌安全', quality: '内容质量', platform_fit: '平台适配' };
  for (const [key, dim] of Object.entries(aData.report.dimensions || {})) {
    console.log(`   ${labels[key] || key}: ${dim.score} ${dim.issues?.length ? '(' + dim.issues.join('; ') + ')' : ''}`);
  }
  if (aData.report.suggestions?.length) {
    console.log(`\n💬 建议：`);
    aData.report.suggestions.forEach(s => console.log(`   - ${s}`));
  }
}

run().catch(err => {
  console.error('💥 异常:', err);
  process.exit(1);
});