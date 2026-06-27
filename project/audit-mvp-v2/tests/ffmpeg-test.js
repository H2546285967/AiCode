// tests/ffmpeg-test.js
// 验证 ffmpeg-static 可用 + 抽帧能力
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

console.log('📁 ffmpeg 路径:', ffmpegPath);
console.log('📁 文件存在:', fs.existsSync(ffmpegPath));

if (!fs.existsSync(ffmpegPath)) {
  console.log('❌ ffmpeg 二进制不存在');
  process.exit(1);
}

// 1. 先尝试用 ffmpeg 自带能力生成一个 3 秒测试视频
async function createTestVideo() {
  const testVideo = path.join(UPLOAD_DIR, 'ffmpeg-test.mp4');
  // ffmpeg -f lavfi -i testsrc=duration=3:size=320x240:rate=10 -pix_fmt yuv420p test.mp4
  console.log('\n🎬 生成 3 秒测试视频...');
  try {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-f', 'lavfi',
      '-i', 'testsrc=duration=3:size=320x240:rate=10',
      '-pix_fmt', 'yuv420p',
      '-c:v', 'libx264',
      testVideo,
    ], { timeout: 30000 });
    console.log('   ✅ 生成成功:', testVideo);
    return testVideo;
  } catch (err) {
    console.log('   ❌ 生成失败:', err.message);
    return null;
  }
}

// 2. 抽帧
async function extractFrames(videoPath) {
  console.log('\n🎞️  抽 3 帧...');
  const framesDir = path.join(UPLOAD_DIR, 'frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  const outputPattern = path.join(framesDir, 'ffmpeg-test-%d.jpg');

  try {
    await execFileAsync(ffmpegPath, [
      '-i', videoPath,
      '-vf', 'fps=1',
      '-vframes', '3',
      '-q:v', '3',
      outputPattern,
    ], { timeout: 30000 });

    const frames = [];
    for (let i = 1; i <= 3; i++) {
      const p = path.join(framesDir, `ffmpeg-test-${i}.jpg`);
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        frames.push({ path: p, sizeKB: Math.round(stat.size / 1024) });
      }
    }
    console.log(`   ✅ 抽帧成功: ${frames.length} 张`);
    frames.forEach(f => console.log(`      ${f.path} (${f.sizeKB}KB)`));
    return frames;
  } catch (err) {
    console.log('   ❌ 抽帧失败:', err.message);
    return [];
  }
}

const videoPath = await createTestVideo();
if (videoPath) {
  const frames = await extractFrames(videoPath);
  console.log(`\n📊 结果: 视频 ${fs.existsSync(videoPath) ? '✅' : '❌'} | 帧 ${frames.length}/3`);
  if (frames.length === 3) {
    console.log('\n🎉 ffmpeg 抽帧功能完全可用！');
  }
}