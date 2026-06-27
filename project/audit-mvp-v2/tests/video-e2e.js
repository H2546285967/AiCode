// tests/video-e2e.js
// 视频端到端：上传 → ffmpeg 抽帧 → mock 审核
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const BASE = `http://localhost:3000`;
const videoPath = path.join(UPLOAD_DIR, 'ffmpeg-test.mp4');

if (!fs.existsSync(videoPath)) {
  console.log('❌ 测试视频不存在，先跑 ffmpeg-test.js 生成');
  process.exit(1);
}

async function run() {
  console.log(`\n🎬 视频端到端测试\n`);

  // 读取视频文件
  const videoBuffer = fs.readFileSync(videoPath);

  // 上传
  console.log('📤 上传视频...');
  const formData = new FormData();
  formData.append('file', new Blob([videoBuffer], { type: 'video/mp4' }), 'compliant-video.mp4');
  formData.append('platform', 'douyin');
  const upRes = await fetch(`${BASE}/api/upload`, { method: 'POST', body: formData });
  const upData = await upRes.json();
  if (!upData.materialId) {
    console.log('❌ 上传失败:', JSON.stringify(upData));
    process.exit(1);
  }
  console.log(`   ✅ materialId = ${upData.materialId}, type = ${upData.materialType}`);

  // 审核（mock 模式不会真抽帧，但代码会判断 video 类型并尝试抽帧）
  console.log('🤖 审核（Mock 模式）...');
  const aRes = await fetch(`${BASE}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ materialId: upData.materialId }),
  });
  const aData = await aRes.json();
  if (!aRes.ok) {
    console.log('❌ 审核失败:', aData.error);
    process.exit(1);
  }

  console.log(`\n✅ 视频审核成功！`);
  console.log(`   类型: ${upData.materialType}`);
  console.log(`   评分: ${aData.riskScore} (${aData.report.verdict})`);
  console.log(`   理由: ${aData.report.reasoning}`);
}

run().catch(err => {
  console.error('💥 异常:', err);
  process.exit(1);
});