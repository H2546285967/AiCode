// src/media.js
// 媒体工具：抽帧 + base64 编码 + 类型检测
// v2 改动：ffmpeg-static 改为 optionalDependencies，抽帧失败时优雅降级

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

let ffmpegPath = null;
try {
  const mod = await import('ffmpeg-static');
  ffmpegPath = mod.default;
} catch {
  ffmpegPath = null;
}

/**
 * ffmpeg 是否可用
 */
export function isFfmpegAvailable() {
  return !!ffmpegPath && fs.existsSync(ffmpegPath);
}

/**
 * 从视频中抽取 N 帧
 */
export async function extractFrames(videoPath, materialId, frameCount = 3) {
  if (!isFfmpegAvailable()) {
    console.warn('[media] ffmpeg 不可用，跳过抽帧（演示版仅支持图片）');
    return [];
  }

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  const framesDir = path.join(uploadDir, 'frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const outputPattern = path.join(framesDir, `${materialId}-%d.jpg`);

  try {
    await execFileAsync(ffmpegPath, [
      '-i', videoPath,
      '-vf', `fps=1/${Math.max(1, Math.floor(10 / frameCount))}`,
      '-vframes', String(frameCount),
      '-q:v', '3',
      outputPattern,
    ], { timeout: 30000 });

    const frames = [];
    for (let i = 1; i <= frameCount; i++) {
      const framePath = path.join(framesDir, `${materialId}-${i}.jpg`);
      if (fs.existsSync(framePath)) frames.push(framePath);
    }
    console.log(`[media] 抽帧成功: ${frames.length} 帧`);
    return frames;
  } catch (err) {
    console.error('[media] ffmpeg 抽帧失败:', err.message);
    return [];
  }
}

/**
 * 把图片文件转 base64（供大模型 API 使用）
 */
export function imageToBase64(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return {
    base64: buffer.toString('base64'),
    mimeType,
    sizeKB: Math.round(buffer.length / 1024),
  };
}

/**
 * 检测文件类型
 */
export function detectMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'unknown';
}