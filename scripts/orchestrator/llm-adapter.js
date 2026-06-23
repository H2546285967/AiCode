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
 *
 * 环境变量：
 *   LLM_BACKEND=heuristic  (默认) | anthropic | ollama | cli
 *
 * @since v1.6.0 (2026-06-22) Tier 1 改造 T1.1
 */

const { heuristicScore } = require('./heuristic-scorer');

/**
 * LLMAdapter 接口（duck typing，无需继承）：
 *   - async score(taskText, grayData) → { scores, composite, reasons, backend }
 *   - string name                          // backend 名称
 */

// ==================== Heuristic Adapter（默认，零依赖）====================

class HeuristicAdapter {
  get name() { return 'heuristic'; }

  async score(taskText, grayData) {
    return heuristicScore(taskText, grayData);
  }
}

// ==================== Anthropic Adapter（接口预留）====================

class AnthropicAdapter {
  constructor(opts = {}) {
    this.apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = opts.model || 'claude-haiku-4-5-20251001';  // 便宜快
    this.timeoutMs = opts.timeoutMs || 5000;
    if (!this.apiKey) {
      throw new Error('AnthropicAdapter 需要 ANTHROPIC_API_KEY 环境变量');
    }
  }

  get name() { return 'anthropic'; }

  async score(taskText, grayData) {
    // 接口预留：实际接入需 @anthropic-ai/sdk 依赖
    // 当前抛错 → 由工厂方法降级到 HeuristicAdapter
    throw new Error(
      '[AnthropicAdapter] 实际接入未启用（v1.6 仅保留接口）\n' +
      '  启用方式：npm install @anthropic-ai/sdk 并实现此方法\n' +
      '  或使用 cli adapter 通过 Claude Code CLI 调用'
    );
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
    throw new Error(
      '[OllamaAdapter] 实际接入未启用（v1.6 仅保留接口）\n' +
      '  启用方式：实现 POST ' + this.baseUrl + '/api/generate 调用\n' +
      '  或使用 cli adapter'
    );
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
    throw new Error(
      '[CliAdapter] 实际接入未启用（v1.6 仅保留接口）\n' +
      '  启用方式：用 child_process.spawn 调 ' + this.command + ' -p "<prompt>"\n' +
      '  解析 stdout 提取 JSON 评分'
    );
  }
}

// ==================== 工厂方法 ====================

/**
 * 根据 LLM_BACKEND 环境变量创建 adapter
 * 默认 heuristic；任何 backend 创建失败 → 返回 HeuristicAdapter（永不抛错）
 */
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
    // 创建失败（缺 API key 等）→ 降级到 heuristic
    process.stderr.write(`[llm-adapter] ${backend} 创建失败，降级到 heuristic: ${e.message}\n`);
    return new HeuristicAdapter();
  }
}

/**
 * 带降级的 score 方法（推荐使用）
 *   - 任何 adapter 抛错 → 自动 fallback 到 heuristic
 *   - 永不抛错给调用方
 */
async function scoreWithFallback(taskText, grayData) {
  const adapter = createAdapter();
  try {
    return await adapter.score(taskText, grayData);
  } catch (e) {
    process.stderr.write(`[llm-adapter] ${adapter.name} 评分失败，降级到 heuristic: ${e.message}\n`);
    return heuristicScore(taskText, grayData);
  }
}

module.exports = {
  HeuristicAdapter,
  AnthropicAdapter,
  OllamaAdapter,
  CliAdapter,
  createAdapter,
  scoreWithFallback,
};
