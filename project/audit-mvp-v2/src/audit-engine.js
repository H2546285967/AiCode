// src/audit-engine.js
// AI 素材审核引擎（Kimi · OpenAI 兼容协议）
// Prompt 来源：H:\AI-han\AiCode\project\一、系统架构总览.md §3.3

import OpenAI from 'openai';
import { extractFrames, imageToBase64, detectMediaType } from './media.js';

const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.KIMI_API_KEY;

let client = null;
if (!USE_MOCK) {
  client = new OpenAI({
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
  });
}

// ===== 审核 Prompt（直接复用方案文档 §3.3） =====
const AUDIT_PROMPT = `你是一名专业的中国广告素材审核员，专门负责抖音/小红书等平台的投放素材合规审核。

【素材信息】
- 平台: {platform}
- 类型: {materialType}
- 文件名: {filename}

【审核维度】（请严格按 0-100 分制打分，分数越高越合规/安全/优质）
1. compliance（合规性）：是否违反《广告法》—— 极限词（最/第一/绝对）、虚假宣传（疗效/承诺）、医疗禁忌、违规承诺收益
2. brand_safety（品牌安全）：是否出现竞品 Logo / 负面信息 / 敏感画面（暴力/低俗/政治敏感）/ 抄袭痕迹
3. quality（内容质量）：画面清晰度、构图合理性、文案通顺度、卖点清晰度
4. platform_fit（平台适配）：是否符合抖音/小红书的社区规范、内容调性、信息流广告标准

【输出要求】严格返回 JSON（不要任何其他文字、代码块标记）：
{
  "overall_score": 0-100,
  "verdict": "pass" | "review" | "reject",
  "dimensions": {
    "compliance": {"score": 0-100, "issues": ["具体问题1", "具体问题2"]},
    "brand_safety": {"score": 0-100, "issues": []},
    "quality": {"score": 0-100, "issues": []},
    "platform_fit": {"score": 0-100, "issues": []}
  },
  "suggestions": ["可执行修改建议1", "可执行修改建议2"],
  "reasoning": "一句话综合判断理由"
}

【判定阈值】
- overall_score >= 80 → pass（通过）
- 50 <= overall_score < 80 → review（人工复审）
- overall_score < 50 → reject（拒绝）
`;

/**
 * Mock 模式：按文件名返回预设结果，让演示效果丰富
 */
function getMockAuditResult(filename, materialType) {
  const name = filename.toLowerCase();
  if (name.includes('合规') || name.includes('good') || name.includes('pass') || name.includes('compliant')) {
    return {
      overall_score: 92,
      verdict: 'pass',
      dimensions: {
        compliance: { score: 95, issues: [] },
        brand_safety: { score: 90, issues: [] },
        quality: { score: 92, issues: [] },
        platform_fit: { score: 90, issues: [] },
      },
      suggestions: ['素材整体质量优秀，可直接投放', '建议在多平台同步发布，最大化触达'],
      reasoning: '内容合规、品牌安全、画面质量、平台适配四维度均表现优秀，无明显问题。',
    };
  }
  if (name.includes('违规') || name.includes('bad') || name.includes('极限')) {
    return {
      overall_score: 32,
      verdict: 'reject',
      dimensions: {
        compliance: { score: 25, issues: ['标题含"最"字极限词，违反广告法第九条', '承诺收益"100% 有效"涉嫌虚假宣传'] },
        brand_safety: { score: 60, issues: [] },
        quality: { score: 45, issues: ['画面构图拥挤，主体不突出'] },
        platform_fit: { score: 35, issues: ['极限词在抖音/小红书均明确禁止'] },
      },
      suggestions: [
        '删除"最""第一""100%"等绝对化用语',
        '将"100% 有效"改为"帮助改善"或"辅助调理"',
        '简化画面构图，突出产品主体',
      ],
      reasoning: '素材存在明显广告法违规（极限词+虚假宣传），需重大修改后才能重新提交。',
    };
  }
  return {
    overall_score: 68,
    verdict: 'review',
    dimensions: {
      compliance: { score: 70, issues: ['"顶级"用词处于边界，建议替换'] },
      brand_safety: { score: 80, issues: [] },
      quality: { score: 65, issues: ['文案过长，关键信息在第 3 屏才出现'] },
      platform_fit: { score: 60, issues: ['竖版 9:16 适配良好，但封面图缺少卖点文字'] },
    },
    suggestions: [
      '将"顶级"改为"优质"或"专业"',
      '封面图加 1 句核心卖点文字（不超过 12 字）',
      '前 3 秒增加钩子，提升完播率',
    ],
    reasoning: '素材整体可投放，但合规和封面吸引力有改进空间，建议人工复审后微调。',
  };
}

/**
 * 调用 Kimi Vision API 审核单张图
 */
async function callKimiForImage(auditPrompt, imagePath, mimeType) {
  const { base64 } = imageToBase64(imagePath);
  const response = await client.chat.completions.create({
    model: process.env.KIMI_MODEL || 'moonshot-v1-8k-vision-preview',
    max_tokens: 2048,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: auditPrompt },
        ],
      },
    ],
  });
  return response.choices[0].message.content;
}

/**
 * 解析模型返回的 JSON
 */
function parseAIResponse(rawText) {
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI 返回内容不包含 JSON: ' + text.slice(0, 200));
  return JSON.parse(match[0]);
}

/**
 * 综合多帧审核结果
 */
function aggregateResults(results) {
  if (results.length === 1) return results[0];
  const avg = (key) => Math.round(results.reduce((sum, r) => sum + (r.dimensions[key]?.score || 0), 0) / results.length);
  const allIssues = results.flatMap(r => Object.values(r.dimensions || {}).flatMap(d => d.issues || []));
  const allSuggestions = [...new Set(results.flatMap(r => r.suggestions || []))];
  const overall = Math.round(results.reduce((s, r) => s + r.overall_score, 0) / results.length);
  return {
    overall_score: overall,
    verdict: overall >= 80 ? 'pass' : overall >= 50 ? 'review' : 'reject',
    dimensions: {
      compliance: { score: avg('compliance'), issues: allIssues.filter(i => /法|违|极|虚|医/.test(i)) },
      brand_safety: { score: avg('brand_safety'), issues: allIssues.filter(i => /竞|负|敏|抄/.test(i)) },
      quality: { score: avg('quality'), issues: allIssues.filter(i => /清|构|文/.test(i)) },
      platform_fit: { score: avg('platform_fit'), issues: allIssues.filter(i => /抖|小红|封|社/.test(i)) },
    },
    suggestions: allSuggestions,
    reasoning: `综合 ${results.length} 帧审核结果：${results[0].reasoning || ''}`,
  };
}

/**
 * 主入口
 */
export async function auditMaterial({ filePath, mimeType, platform = 'douyin', sourceFilename }) {
  const materialType = detectMediaType(mimeType);

  console.log(`[audit] 开始审核: ${sourceFilename} (${materialType}, ${USE_MOCK ? 'MOCK' : 'KIMI'} 模式)`);

  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return getMockAuditResult(sourceFilename, materialType);
  }

  // 准备审核图片
  let imagesToAudit = [];
  if (materialType === 'image') {
    imagesToAudit = [{ path: filePath, mimeType }];
  } else if (materialType === 'video') {
    const materialId = Date.now().toString();
    const frames = await extractFrames(filePath, materialId, 3);
    if (frames.length > 0) {
      imagesToAudit = frames.map(f => ({ path: f, mimeType: 'image/jpeg' }));
    }
  }

  if (imagesToAudit.length === 0) {
    return getMockAuditResult(sourceFilename, materialType);
  }

  const prompt = AUDIT_PROMPT
    .replace('{platform}', platform === 'douyin' ? '抖音' : '小红书')
    .replace('{materialType}', materialType === 'image' ? '图片' : '视频')
    .replace('{filename}', sourceFilename);

  const calls = imagesToAudit.map(img =>
    callKimiForImage(prompt, img.path, img.mimeType)
      .then(raw => parseAIResponse(raw))
      .catch(err => {
        console.error('[audit] 单帧审核失败:', err.message);
        return getMockAuditResult(sourceFilename, materialType);
      })
  );

  const results = await Promise.all(calls);
  return aggregateResults(results);
}