// src/routes/upload.js
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { insertMaterial } from '../db.js';
import { detectMediaType } from '../media.js';

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    // multer 收到 originalname 是 latin1 编码的 Buffer，Node 默认 UTF-8，需转码
    const originalName = Buffer.isBuffer(file.originalname)
      ? file.originalname.toString('utf8')
      : file.originalname;
    const ext = path.extname(originalName);
    cb(null, `${ts}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片和视频文件'));
    }
  },
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '未收到文件' });

    const platform = req.body.platform || 'douyin';
    const materialType = detectMediaType(req.file.mimetype);
    // multer 传 originalname 是 latin1 Buffer，转 UTF-8 解决 Windows 中文乱码
    const sourceFilename = Buffer.isBuffer(req.file.originalname)
      ? req.file.originalname.toString('utf8')
      : req.file.originalname;
    const id = insertMaterial({
      platform,
      materialType,
      sourceFilename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      title: req.body.title || null,
    });

    res.json({
      materialId: id,
      materialType,
      filePath: req.file.path,
      fileSize: req.file.size,
      message: '上传成功',
    });
  } catch (err) {
    console.error('[upload]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;