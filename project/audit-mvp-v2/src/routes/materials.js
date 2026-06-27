// src/routes/materials.js
import express from 'express';
import { listMaterials, getMaterial, getAuditLogs } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const items = listMaterials({ limit, offset });
  res.json({ items, count: items.length });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const material = getMaterial(id);
  if (!material) return res.status(404).json({ error: '素材不存在' });
  const logs = getAuditLogs(id);
  res.json({ material, logs });
});

export default router;