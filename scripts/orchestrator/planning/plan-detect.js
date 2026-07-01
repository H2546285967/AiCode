#!/usr/bin/env node
/**
 * plan-detect.js — 智能任务规划检测器（v1.9.1 智能增量 B）
 *
 * 触发位置：PostToolUse hook（每次 Claude 输出后）
 * 作用：从 Claude 输出中检测 [plan]...[/plan] 块，写入 pending-plans.json
 *       配合 CLAUDE.md "智能任务规划协议"，让用户能用 /ok /no 批准/取消
 *
 * 协议格式（CLAUDE.md §智能任务规划协议）：
 *   [plan]
 *   任务: <标题>
 *   目标: <完成什么>
 *   步骤:
 *     1. <步骤>
 *     ...
 *   预计改动: <文件数> 个文件
 *   预计风险: <低/中/高>
 *   回退方案: <怎么撤>
 *   [/plan]
 *
 * 设计原则：
 *   - 永不阻塞主流程（任何异常 exit 0）
 *   - 单 plan 块（不嵌套）
 *   - JSONL 落盘（gitignore 排除）
 *   - 去重（同 plan 文本 100 条内不重复）
 *
 * @since v1.9.1 (2026-06-24)
 * @source 04_自我进化循环系统设计.md §0.4 增量 B
 */

const fs = require('fs');
const path = require('path');

// ── 配置 ─────────────────────────────────────────────

const SKILL_DIR = path.join(__dirname, '..', '..', '..', '.claude', 'skills', 'left-brain');
const MEMORY_DIR = path.join(SKILL_DIR, 'memory');
const PENDING_PLANS_FILE = path.join(MEMORY_DIR, 'pending-plans.json');

// ── 工具函数 ─────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 从文本中提取所有 [plan]...[/plan] 块
 * @param {string} text
 * @returns {string[]} 每个元素是一个 plan 块的内文
 */
function extractPlanBlocks(text) {
  if (!text || typeof text !== 'string') return [];
  const re = /\[plan\]([\s\S]*?)\[\/plan\]/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

/**
 * 解析单个 plan 块内文为结构化对象
 * @param {string} blockContent
 * @returns {object|null}
 */
function parsePlanBlock(blockContent) {
  if (!blockContent || typeof blockContent !== 'string') return null;

  const plan = {
    raw: blockContent,
    task: null,
    goal: null,
    steps: [],
    estimated_changes: null,
    estimated_risk: null,
    rollback: null,
  };

  const lines = blockContent.split('\n');
  let currentSection = null;
  let currentStep = null;  // 当前正在构造的 step 对象

  function commitStep() {
    if (currentStep && currentStep.text) {
      // 解析 files 字段（逗号分隔）成数组
      if (currentStep._filesRaw) {
        currentStep.files = currentStep._filesRaw
          .split(/[,，]/)
          .map(f => f.trim())
          .filter(Boolean);
        delete currentStep._filesRaw;
      }
      plan.steps.push({
        text: currentStep.text,
        ...(currentStep.agent && { agent: currentStep.agent }),
        ...(currentStep.files && currentStep.files.length > 0 && { files: currentStep.files }),
        ...(currentStep.verification && { verification: currentStep.verification }),
      });
    }
    currentStep = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // 提取字段
    if (/^任务[：:]/.test(trimmed)) {
      commitStep();
      plan.task = trimmed.replace(/^任务[：:]\s*/, '');
      currentSection = null;
    } else if (/^目标[：:]/.test(trimmed)) {
      commitStep();
      plan.goal = trimmed.replace(/^目标[：:]\s*/, '');
      currentSection = null;
    } else if (/^预计改动[：:]/.test(trimmed)) {
      commitStep();
      plan.estimated_changes = trimmed.replace(/^预计改动[：:]\s*/, '');
      currentSection = null;
    } else if (/^预计风险[：:]/.test(trimmed)) {
      commitStep();
      plan.estimated_risk = trimmed.replace(/^预计风险[：:]\s*/, '');
      currentSection = null;
    } else if (/^回退方案[：:]/.test(trimmed)) {
      commitStep();
      plan.rollback = trimmed.replace(/^回退方案[：:]\s*/, '');
      currentSection = null;
    } else if (/^步骤[：:]/.test(trimmed)) {
      commitStep();
      currentSection = 'steps';
    } else if (currentSection === 'steps') {
      // 匹配 "1. xxx" 或 "1) xxx"
      const stepMatch = trimmed.match(/^\d+[.)、]\s*(.+)$/);
      if (stepMatch) {
        // 新 step：提交上一个，开启新的
        commitStep();
        currentStep = { text: stepMatch[1] };
      } else if (/^agent[：:]\s*/i.test(trimmed)) {
        // agent: explorer
        if (currentStep) {
          currentStep.agent = trimmed.replace(/^agent[：:]\s*/i, '').trim();
        }
      } else if (/^files[：:]\s*/i.test(trimmed)) {
        // files: a.js, b.js
        if (currentStep) {
          currentStep._filesRaw = trimmed.replace(/^files[：:]\s*/i, '').trim();
        }
      } else if (/^验证[：:]\s*/i.test(trimmed)) {
        // 验证: 该步骤完成的可验证标准
        if (currentStep) {
          currentStep.verification = trimmed.replace(/^验证[：:]\s*/i, '').trim();
        }
      } else if (trimmed && !/^[A-Za-z一-龥]+[：:]/.test(trimmed)) {
        // 步骤延续（下一行是上一行的说明）
        if (currentStep) {
          currentStep.text += ' ' + trimmed;
        }
      }
    }
  }

  // 别忘了最后一个 step
  commitStep();

  // 必须同时有 task 和至少 1 个 step 才算有效 plan
  if (!plan.task || plan.steps.length === 0) return null;

  return plan;
}

/**
 * Fallback：从 step.text 提取文件路径（当 step.files 缺失时）
 * @param {string} text
 * @returns {string[]}
 */
function extractFilesFromText(text) {
  if (!text) return [];
  // 匹配常见文件路径（含扩展名）
  const matches = text.match(/[\w./\\-]+\.(js|ts|md|json|sh|py|yaml|yml|toml|css|html|sql)\b/g);
  if (!matches) return [];
  // 去重
  return [...new Set(matches)];
}

/**
 * 应用 fallback：如果 step 缺 agent/files，从 text 推断
 * @param {object} step
 * @returns {object} 填充后的 step
 */
function applyFallback(step) {
  const result = { ...step };
  if (!result.agent) {
    result.agent = 'claude';  // 默认通用 agent
  }
  if (!result.files || result.files.length === 0) {
    result.files = extractFilesFromText(result.text);
  }
  if (!result.verification) {
    result.verification = '步骤完成且无回归';
  }
  return result;
}

/**
 * 加载所有 pending plans（数组，最新在末尾）
 */
function loadPendingPlans() {
  if (!fs.existsSync(PENDING_PLANS_FILE)) return [];
  try {
    const content = fs.readFileSync(PENDING_PLANS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * 保存 pending plans
 */
function savePendingPlans(plans) {
  ensureDir(MEMORY_DIR);
  fs.writeFileSync(PENDING_PLANS_FILE, JSON.stringify(plans, null, 2));
}

/**
 * 去重：同 plan raw 100 条内不重复
 */
function isDuplicate(planRaw) {
  const plans = loadPendingPlans();
  const recent = plans.slice(-100);
  return recent.some(p => p.plan?.raw === planRaw);
}

/**
 * 检测 plan 块（核心入口）
 * @param {string} text - Claude 输出文本
 * @returns {object[]} 写入的 plan 对象（含 timestamp + status: 'pending'）
 */
function detectPlans(text) {
  const blocks = extractPlanBlocks(text);
  if (blocks.length === 0) return [];

  const written = [];
  for (const block of blocks) {
    const parsed = parsePlanBlock(block);
    if (!parsed) continue;

    if (isDuplicate(parsed.raw)) continue;

    const entry = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',  // pending → approved | cancelled
      plan: parsed,
    };

    try {
      const plans = loadPendingPlans();
      plans.push(entry);
      savePendingPlans(plans);
      written.push(entry);
    } catch (e) { /* 写失败不阻塞 */ }
  }

  return written;
}

/**
 * 批准最新 pending plan
 * @returns {object|null}
 */
function approveLatest() {
  const plans = loadPendingPlans();
  const pending = plans.filter(p => p.status === 'pending');
  if (pending.length === 0) return null;
  const latest = pending[pending.length - 1];
  latest.status = 'approved';
  latest.approved_at = new Date().toISOString();
  savePendingPlans(plans);
  return latest;
}

/**
 * 取消最新 pending plan
 * @returns {object|null}
 */
function cancelLatest() {
  const plans = loadPendingPlans();
  const pending = plans.filter(p => p.status === 'pending');
  if (pending.length === 0) return null;
  const latest = pending[pending.length - 1];
  latest.status = 'cancelled';
  latest.cancelled_at = new Date().toISOString();
  savePendingPlans(plans);
  return latest;
}

/**
 * 列所有 pending plans
 */
function listPending() {
  return loadPendingPlans().filter(p => p.status === 'pending');
}

// ── CLI 入口 ────────────────────────────────────────

if (require.main === module) {
  const cmd = process.argv[2] || 'detect';

  try {
    switch (cmd) {
      case 'detect': {
        // stdin 读 Claude 输出（可能来自 hook JSON）
        let input = '';
        if (process.argv[3]) {
          input = process.argv[3];
        } else {
          try { input = fs.readFileSync(0, 'utf8'); } catch {}
        }

        let text = input;
        // 如果是 hook JSON，提取 content/output_text 字段
        try {
          const data = JSON.parse(input);
          text = data.content || data.output_text || data.text || data.response || input;
        } catch { /* 不是 JSON 就当文本 */ }

        const written = detectPlans(text);
        if (written.length > 0) {
          console.log(`[plan-detect] 检测到 ${written.length} 个 plan，等待 /ok 或 /no`);
          for (const w of written) {
            console.log(`  📋 ${w.plan.task || '未命名任务'}（${w.plan.steps.length} 步骤）`);
          }
        }
        break;
      }
      case 'approve': {
        const r = approveLatest();
        if (r) {
          console.log(`✅ 已批准: ${r.plan.task || '未命名'}`);
        } else {
          console.log('⚠️  无待批准 plan');
        }
        break;
      }
      case 'cancel': {
        const r = cancelLatest();
        if (r) {
          console.log(`❌ 已取消: ${r.plan.task || '未命名'}`);
        } else {
          console.log('⚠️  无待取消 plan');
        }
        break;
      }
      case 'list': {
        const pending = listPending();
        if (pending.length === 0) {
          console.log('📋 无 pending plan');
        } else {
          console.log(`📋 ${pending.length} 个 pending plan：`);
          for (const p of pending) {
            console.log(`  - [${p.id}] ${p.plan.task || '未命名'}（${p.plan.steps.length} 步骤）`);
          }
        }
        break;
      }
      default:
        console.error(`未知命令: ${cmd}（支持: detect / approve / cancel / list）`);
        process.exit(1);
    }
  } catch (e) {
    // 永不 throw
  }
  process.exit(0);
}

module.exports = {
  extractPlanBlocks,
  parsePlanBlock,
  extractFilesFromText,
  applyFallback,
  detectPlans,
  approveLatest,
  cancelLatest,
  listPending,
  PENDING_PLANS_FILE,
};