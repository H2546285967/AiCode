#!/usr/bin/env node
/**
 * LLM Adapter —— 标准接口 + 4 种 backend 实现
 *
 * 设计目的：
 *   - 暴露统一的 LLMAdapter 接口，未来接 Anthropic / Ollama / Claude CLI 都只需换 adapter
 *   - 启发式作为默认 backend（零成本、零依赖、确定性）
 *   - 失败降级：任何 LLM backend 失败时自动 fallback 到 heuristic
 *
 * 用法：
 *   const adapter = createAdapter();              // 根据 LLM_BACKEND 环境变量选择
 *   const result = await adapter.score(taskText, grayData);
 *   const gen = await adapter.generate(prompt);
 *   const ev = await adapter.evaluate(prompt, { dimensions: ['clarity', 'coverage'] });
 *
 * 环境变量：
 *   LLM_BACKEND=heuristic  (默认) | anthropic | ollama | cli
 *   ANTHROPIC_API_KEY       (anthropic backend 需要)
 *   ANTHROPIC_MODEL         (可选，默认 claude-haiku-4-5-20251001)
 *
 * @since v1.6.0 (2026-06-22) Tier 1 改造 T1.1
 * @changed v3.0.8 (2026-07-01) M54 Phase 2：实现 AnthropicAdapter.generate / evaluate（raw fetch，无新依赖）
 */

const { heuristicScore } = require('./heuristic-scorer');

// ==================== Heuristic Adapter（默认，零依赖）====================

class HeuristicAdapter {
  get name() { return 'heuristic'; }

  async score(taskText, grayData) {
    return heuristicScore(taskText, grayData);
  }

  /**
   * 启发式生成（零成本 fallback）
   */
  async generate(prompt, opts = {}) {
    const p = (prompt || '').toLowerCase();
    const maxTokens = opts.maxTokens || 500;

    // prompt-optimizer rewrite 场景
    if (p.includes('rewrite') || p.includes('优化') || p.includes('改写') || p.includes('improve this prompt')) {
      return {
        text: '优化后的 prompt 版本（启发式占位）：\n1. 明确角色与目标\n2. 补充输入/输出格式约束\n3. 添加逐步推理要求\n4. 给出示例（few-shot）\n5. 声明禁止项与边界',
        backend: this.name,
        tokens: { prompt: p.length, completion: 80 },
      };
    }

    // test-coverage
    if (p.includes('test') || p.includes('测试') || p.includes('coverage')) {
      return {
        text: '建议为每个待测文件创建 `test-<basename>.js`，覆盖：\n1. 正常路径\n2. 边界条件\n3. 异常输入\n4. 与相邻模块的集成点\n\n优先补核心调度器、反射引擎、MCP server 的测试。',
        backend: this.name,
        tokens: { prompt: p.length, completion: 80 },
      };
    }

    // deps-outdated
    if (p.includes('depend') || p.includes('依赖') || p.includes('npm') || p.includes('version')) {
      return {
        text: '依赖升级建议：\n1. 先 `npm outdated` 看实际版本\n2. 只升级 patch/minor，major 版本需阅读 changelog\n3. 升级后跑 `npm test` 全量回归\n4. 关键依赖（如 MCP SDK） pinning 到精确版本',
        backend: this.name,
        tokens: { prompt: p.length, completion: 70 },
      };
    }

    // candidate-pending / implementation
    if (p.includes('implement') || p.includes('实现') || p.includes('candidate')) {
      return {
        text: '实现候选建议：\n1. 先阅读候选仓库 README 和核心入口\n2. 在 worktree 隔离环境中实验\n3. 写一个最小可运行 demo\n4. 通过后再合并到 main\n5. 补充测试和文档',
        backend: this.name,
        tokens: { prompt: p.length, completion: 75 },
      };
    }

    // 通用 fallback
    return {
      text: '建议：\n1. 明确问题范围\n2. 最小改动原则\n3. 补充测试\n4. 跑 `npm test` 验证\n5. 更新相关文档',
      backend: this.name,
      tokens: { prompt: p.length, completion: 40 },
    };
  }

  /**
   * 启发式 evaluate：对 prompt 按维度做 keyword-based 评估
   */
  async evaluate(prompt, opts = {}) {
    const p = prompt || '';
    const lower = p.toLowerCase();
    const dimensions = opts.dimensions || ['clarity', 'coverage', 'actionability', 'safety'];

    const dimScores = {};
    const weaknesses = [];

    for (const dim of dimensions) {
      switch (dim) {
        case 'clarity': {
          let s = 7;
          if (lower.length < 50) { s -= 2; weaknesses.push('prompt 过短，角色/目标可能不明确'); }
          if (!/你是|你作为|as a|role:|角色/.test(p)) { s -= 1.5; weaknesses.push('缺少显式角色定义'); }
          if (!/目标|目的|goal|objective|task/.test(p)) { s -= 1; weaknesses.push('缺少显式目标/任务描述'); }
          dimScores[dim] = Math.max(0, s);
          break;
        }
        case 'coverage': {
          let s = 7;
          if (!/示例|example|few.shot|sample/.test(p)) { s -= 1; weaknesses.push('缺少示例（few-shot）'); }
          if (!/边界|edge case|exception|错误处理|error/.test(p)) { s -= 1; weaknesses.push('未提及边界/错误处理'); }
          dimScores[dim] = Math.max(0, s);
          break;
        }
        case 'actionability': {
          let s = 7;
          if (!/步骤|step|逐步|first|then|finally|请按/.test(p)) { s -= 1.5; weaknesses.push('缺少分步执行指示'); }
          if (!/输出|output|format|返回|json|markdown/.test(p)) { s -= 1; weaknesses.push('未指定输出格式'); }
          dimScores[dim] = Math.max(0, s);
          break;
        }
        case 'safety': {
          let s = 8;
          if (/eval\s*\(|Function\s*\(|exec\s*\(/.test(p)) { s -= 3; weaknesses.push('包含 eval/exec/Function 等危险模式'); }
          if (/(password|secret|api[_-]?key|token)\s*[:=]/.test(p)) { s -= 2; weaknesses.push('疑似要求输出密钥'); }
          dimScores[dim] = Math.max(0, s);
          break;
        }
        default:
          dimScores[dim] = 6;
      }
    }

    const scores = Object.values(dimScores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const verdict = avg >= 7 ? 'PASS' : (avg >= 5 ? 'WARN' : 'FAIL');

    return {
      verdict,
      score: avg,
      dimensions: dimScores,
      reasons: [`heuristic: 平均 ${avg.toFixed(1)} 分（维度: ${Object.keys(dimScores).join(', ')}）`],
      weaknesses: Array.from(new Set(weaknesses)),
      actions: weaknesses.map(w => `修复: ${w}`),
      backend: this.name,
    };
  }

  /**
   * 启发式 judge（零成本 fallback）
   */
  async judge(candidate, criteria = {}) {
    const minComposite = criteria.minComposite ?? 7.0;
    const allowedEffort = criteria.allowedEffort ?? ['small'];
    const forbiddenDeps = criteria.forbiddenDeps ?? [];

    if (!candidate || typeof candidate !== 'object') {
      return {
        verdict: 'reject',
        score: 0,
        reasons: [`heuristic: candidate 无效 (${typeof candidate})`],
        backend: this.name,
      };
    }

    const score = candidate.composite_score || candidate.score || 0;
    const effort = (candidate.estimated_effort || candidate.effort || 'medium').toLowerCase();
    const desc = `${candidate.name || ''} ${candidate.description || ''} ${candidate.summary || ''}`.toLowerCase();

    for (const dep of forbiddenDeps) {
      if (desc.includes(dep.toLowerCase())) {
        return {
          verdict: 'reject',
          score,
          reasons: [`heuristic: 包含禁止依赖 "${dep}"`],
          backend: this.name,
        };
      }
    }

    if (score < minComposite) {
      return {
        verdict: 'reject',
        score,
        reasons: [`heuristic: composite ${score} < ${minComposite}`],
        backend: this.name,
      };
    }

    if (!allowedEffort.includes(effort)) {
      return {
        verdict: 'skip',
        score,
        reasons: [`heuristic: effort "${effort}" 不在 [${allowedEffort.join(',')}]，需要人工确认`],
        backend: this.name,
      };
    }

    const sug = candidate.suggestion || 'adopt';
    if (!['adopt', 'adapt'].includes(sug)) {
      return {
        verdict: 'skip',
        score,
        reasons: [`heuristic: suggestion "${sug}" 非 adopt/adapt`],
        backend: this.name,
      };
    }

    return {
      verdict: 'accept',
      score,
      reasons: [`heuristic: score ${score} >= ${minComposite}, effort=${effort}, sug=${sug}`],
      backend: this.name,
    };
  }
}

// ==================== Anthropic Adapter（raw fetch，无 SDK 依赖）====================

class AnthropicAdapter {
  constructor(opts = {}) {
    this.apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = opts.model || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
    this.baseUrl = opts.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
    this.timeoutMs = opts.timeoutMs || 30000;
    if (!this.apiKey) {
      throw new Error('AnthropicAdapter 需要 ANTHROPIC_API_KEY 环境变量');
    }
  }

  get name() { return 'anthropic'; }

  async _callMessages(system, messages, opts = {}) {
    const maxTokens = opts.maxTokens || 1024;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          system,
          messages,
          temperature: opts.temperature ?? 0.3,
        }),
      });

      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.content
        ?.filter(c => c.type === 'text')
        ?.map(c => c.text)
        ?.join('') || '';

      return {
        text,
        usage: data.usage || { input_tokens: 0, output_tokens: 0 },
        model: data.model || this.model,
      };
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  async score(taskText, grayData) {
    // 暂不实现真实 score，抛错降级到 heuristic
    throw new Error('[AnthropicAdapter] score 未实现，将降级到 heuristic');
  }

  async generate(prompt, opts = {}) {
    const res = await this._callMessages(
      'You are a helpful coding assistant. Be concise and actionable.',
      [{ role: 'user', content: prompt }],
      opts
    );
    return {
      text: res.text,
      backend: this.name,
      tokens: {
        prompt: res.usage.input_tokens,
        completion: res.usage.output_tokens,
      },
      model: res.model,
    };
  }

  async evaluate(prompt, opts = {}) {
    const dimensions = opts.dimensions || ['clarity', 'coverage', 'actionability', 'safety'];
    const system = `You are a rigorous prompt-engineering evaluator. Respond ONLY with valid JSON (no markdown, no explanation) matching this schema:
{
  "verdict": "PASS|WARN|FAIL",
  "score": 0-10 number,
  "dimensions": { "clarity": 0-10, "coverage": 0-10, "actionability": 0-10, "safety": 0-10 },
  "reasons": ["string"],
  "weaknesses": ["string"],
  "actions": ["string"]
}`;
    const userPrompt = `Evaluate the following prompt across these dimensions: ${dimensions.join(', ')}.

Prompt:\n---\n${prompt}\n---\n
Return JSON only.`;

    const res = await this._callMessages(system, [{ role: 'user', content: userPrompt }], { maxTokens: 1024, temperature: 0.2 });

    let parsed;
    try {
      const cleaned = res.text.replace(/^```json\s*|\s*```$/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Anthropic evaluate JSON parse failed: ${e.message}\nRaw: ${res.text.slice(0, 200)}`);
    }

    return {
      verdict: parsed.verdict || 'ERROR',
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      dimensions: parsed.dimensions || {},
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      backend: this.name,
      model: res.model,
    };
  }

  async judge(candidate, criteria = {}) {
    const system = `You are a gatekeeper deciding whether to auto-implement a candidate feature. Respond ONLY with valid JSON matching:
{
  "verdict": "accept|reject|skip",
  "score": 0-10 number,
  "reasons": ["string"]
}`;
    const userPrompt = `Candidate:\n${JSON.stringify(candidate, null, 2)}\n\nCriteria:\n${JSON.stringify(criteria, null, 2)}\n\nReturn JSON only.`;
    const res = await this._callMessages(system, [{ role: 'user', content: userPrompt }], { maxTokens: 512, temperature: 0.2 });

    let parsed;
    try {
      const cleaned = res.text.replace(/^```json\s*|\s*```$/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Anthropic judge JSON parse failed: ${e.message}`);
    }

    return {
      verdict: parsed.verdict || 'skip',
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      backend: this.name,
    };
  }
}

// ==================== Ollama Adapter（本地模型，接口预留）====================

class OllamaAdapter {
  constructor(opts = {}) {
    this.baseUrl = opts.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = opts.model || process.env.OLLAMA_MODEL || 'qwen2.5:7b';
    this.timeoutMs = opts.timeoutMs || 30000;
  }

  get name() { return 'ollama'; }

  async score(taskText, grayData) {
    throw new Error('[OllamaAdapter] 实际接入未启用（v1.6 仅保留接口）');
  }

  async generate(prompt, opts = {}) {
    throw new Error('[OllamaAdapter] generate 未启用');
  }

  async evaluate(prompt, opts = {}) {
    throw new Error('[OllamaAdapter] evaluate 未启用');
  }

  async judge(candidate, criteria = {}) {
    throw new Error('[OllamaAdapter] judge 未启用');
  }
}

// ==================== CLI Adapter（通过子进程调 Claude CLI，接口预留）====================

class CliAdapter {
  constructor(opts = {}) {
    this.command = opts.command || 'claude';
    this.timeoutMs = opts.timeoutMs || 30000;
  }

  get name() { return 'cli'; }

  async score(taskText, grayData) {
    throw new Error('[CliAdapter] 实际接入未启用（v1.6 仅保留接口）');
  }

  async generate(prompt, opts = {}) {
    throw new Error('[CliAdapter] generate 未启用');
  }

  async evaluate(prompt, opts = {}) {
    throw new Error('[CliAdapter] evaluate 未启用');
  }

  async judge(candidate, criteria = {}) {
    throw new Error('[CliAdapter] judge 未启用');
  }
}

// ==================== 工厂方法 ====================

function createAdapter(backendName) {
  const backend = (backendName || process.env.LLM_BACKEND || 'heuristic').toLowerCase();
  try {
    switch (backend) {
      case 'anthropic':
        return new AnthropicAdapter();
      case 'ollama':
        return new OllamaAdapter();
      case 'cli':
        return new CliAdapter();
      case 'heuristic':
      default:
        return new HeuristicAdapter();
    }
  } catch (e) {
    process.stderr.write(`[llm-adapter] ${backend} 创建失败，降级到 heuristic: ${e.message}\n`);
    return new HeuristicAdapter();
  }
}

async function scoreWithFallback(taskText, grayData) {
  const adapter = createAdapter();
  try {
    return await adapter.score(taskText, grayData);
  } catch (e) {
    process.stderr.write(`[llm-adapter] ${adapter.name} 评分失败，降级到 heuristic: ${e.message}\n`);
    return heuristicScore(taskText, grayData);
  }
}

async function generateWithFallback(prompt, opts = {}) {
  const adapter = createAdapter();
  try {
    return await adapter.generate(prompt, opts);
  } catch (e) {
    process.stderr.write(`[llm-adapter] ${adapter.name} 生成失败，降级到 heuristic: ${e.message}\n`);
    return new HeuristicAdapter().generate(prompt, opts);
  }
}

async function evaluateWithFallback(prompt, opts = {}) {
  const adapter = createAdapter();
  try {
    return await adapter.evaluate(prompt, opts);
  } catch (e) {
    process.stderr.write(`[llm-adapter] ${adapter.name} 评估失败，降级到 heuristic: ${e.message}\n`);
    return new HeuristicAdapter().evaluate(prompt, opts);
  }
}

async function judgeCandidateWithFallback(candidate, criteria = {}, opts = {}) {
  const adapter = createAdapter();
  try {
    return await adapter.judge(candidate, criteria, opts);
  } catch (e) {
    process.stderr.write(`[llm-adapter] ${adapter.name} 判定失败，降级到 heuristic: ${e.message}\n`);
    return new HeuristicAdapter().judge(candidate, criteria);
  }
}

module.exports = {
  HeuristicAdapter,
  AnthropicAdapter,
  OllamaAdapter,
  CliAdapter,
  createAdapter,
  scoreWithFallback,
  generateWithFallback,
  evaluateWithFallback,
  judgeCandidateWithFallback,
};
