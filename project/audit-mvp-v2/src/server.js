// src/server.js
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js';  // 触发 DB 初始化
import uploadRouter from './routes/upload.js';
import auditRouter from './routes/audit.js';
import materialsRouter from './routes/materials.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/upload', uploadRouter);
app.use('/api/audit', auditRouter);
app.use('/api/materials', materialsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.USE_MOCK === 'true' || !process.env.KIMI_API_KEY ? 'MOCK' : 'KIMI',
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('[server]', err);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI 素材审核 Demo v2 已启动`);
  console.log(`   访问: http://localhost:${PORT}`);
  console.log(`   模式: ${process.env.USE_MOCK === 'true' || !process.env.KIMI_API_KEY ? '🎭 MOCK（演示用）' : '🤖 KIMI API'}`);
  console.log(`   健康: http://localhost:${PORT}/api/health\n`);
});