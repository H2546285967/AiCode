// src/routes/audit.js
import express from 'express';
import { auditMaterial } from '../audit-engine.js';
import { getMaterial, updateMaterialResult, insertAuditLog } from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { materialId } = req.body;
    if (!materialId) return res.status(400).json({ error: '缺少 materialId' });

    const material = getMaterial(materialId);
    if (!material) return res.status(404).json({ error: '素材不存在' });

    console.log(`[audit-api] 审核素材 #${materialId}: ${material.source_filename}`);

    const report = await auditMaterial({
      filePath: material.file_path,
      mimeType: material.mime_type,
      platform: material.platform,
      sourceFilename: material.source_filename,
    });

    insertAuditLog({
      materialId,
      stage: material.material_type,
      result: report.verdict,
      confidence: report.overall_score / 100,
      details: report,
    });

    const status = report.verdict === 'pass' ? 'approved' :
                   report.verdict === 'review' ? 'human_review' : 'rejected';
    updateMaterialResult(materialId, { status, riskScore: report.overall_score, aiResult: report });

    res.json({ materialId, status, riskScore: report.overall_score, report });
  } catch (err) {
    console.error('[audit-api]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;