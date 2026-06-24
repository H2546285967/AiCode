#!/usr/bin/env node
/**
 * withRetry —— 通用重试 + 超时工具（v1.9 P0-2）
 *
 * 作用：
 *   - 给任何返回 Promise 的函数加 retry + timeout
 *   - 指数退避（默认 backoff=2）
 *   - 区分"可重试错误"和"立即失败错误"
 *
 * 用法：
 *   const { withRetry } = require('./with-retry');
 *   const result = await withRetry(
 *     async ({ signal }) => fetch('https://api.example.com', { signal }),
 *     { retries: 3, timeoutMs: 5000 }
 *   );
 *
 * 设计原则（v1.9）：
 *   - 不动 dispatcher.js 核心（保持向后兼容）
 *   - 独立模块，按需 require
 *   - 默认参数保守（retries=2, timeoutMs=30000）
 *
 * @since v1.9.0 (2026-06-24) P0-2
 */

/**
 * 判断错误是否可重试
 * 默认：网络错误 + 5xx + 超时/中断 = 可重试
 *       4xx 客户端错误 = 立即失败
 * @param {Error} err
 * @returns {boolean}
 */
function isRetryable(err) {
  // AbortError（超时）
  if (err.name === 'AbortError' || err.code === 'ABORT_ERR') return true;
  // 网络层错误
  if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'].includes(err.code)) return true;
  // HTTP 5xx（如果有 status 字段）
  if (typeof err.status === 'number' && err.status >= 500) return true;
  // 显式标记
  if (err.retryable === true) return true;
  // 默认：4xx / 业务错误不可重试
  if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) return false;
  // 未知错误：保守不重试
  return false;
}

/**
 * 带 retry + timeout 的执行器
 *
 * @param {(ctx: {signal: AbortSignal, attempt: number}) => Promise<T>} fn
 * @param {object} [opts]
 * @param {number} [opts.retries=2]          最大重试次数（不含首次）
 * @param {number} [opts.timeoutMs=30000]    每次尝试的超时
 * @param {number} [opts.backoff=2]          退避基数（ms = 1000 * backoff^(attempt-1)）
 * @param {number} [opts.maxBackoffMs=30000] 单次退避上限
 * @param {function} [opts.onRetry]          重试回调 (err, attempt, delayMs)
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
  const {
    retries = 2,
    timeoutMs = 30000,
    backoff = 2,
    maxBackoffMs = 30000,
    onRetry,
  } = opts;

  if (typeof fn !== 'function') {
    throw new TypeError('withRetry: fn must be a function');
  }

  let lastErr;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn({ signal: controller.signal, attempt });
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;

      const retryable = isRetryable(err);
      const isLastAttempt = attempt > retries;

      if (isLastAttempt || !retryable) {
        if (!retryable && attempt === 1) {
          // 首次就不可重试的错误：直接抛，附上 retryable 信息
          err.retryable = retryable;
        }
        throw err;
      }

      // 退避：1000 * backoff^(attempt-1)，封顶 maxBackoffMs
      const delay = Math.min(1000 * Math.pow(backoff, attempt - 1), maxBackoffMs);
      if (typeof onRetry === 'function') {
        try { onRetry(err, attempt, delay); } catch { /* ignore callback error */ }
      }
      await new Promise(r => setTimeout(r, delay));
    }
  }
  // 理论上不会到这里
  throw lastErr;
}

module.exports = { withRetry, isRetryable };

// ==================== CLI 自测 ====================
if (require.main === module) {
  // 简单自测
  (async () => {
    let calls = 0;
    try {
      const result = await withRetry(
        async ({ attempt }) => {
          calls++;
          if (attempt < 3) throw Object.assign(new Error('mock fail'), { code: 'ECONNRESET' });
          return 'success';
        },
        { retries: 3, timeoutMs: 1000, onRetry: (e, a, d) => console.log(`[retry ${a}] ${e.message}, sleep ${d}ms`) }
      );
      console.log(`✅ retry 测试通过: ${result} (调用 ${calls} 次)`);
    } catch (e) {
      console.error(`❌ retry 测试失败: ${e.message}`);
      process.exit(1);
    }

    // 超时测试
    try {
      await withRetry(
        async ({ signal }) => {
          await new Promise((resolve, reject) => {
            const t = setTimeout(resolve, 5000);
            signal.addEventListener('abort', () => {
              clearTimeout(t);
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
            });
          });
        },
        { retries: 0, timeoutMs: 100 }
      );
      console.error('❌ 超时测试失败：应抛 AbortError');
      process.exit(1);
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log(`✅ 超时测试通过: ${e.message}`);
      } else {
        console.error(`❌ 超时测试失败: ${e.message}`);
        process.exit(1);
      }
    }

    // 不可重试测试（4xx 立即失败）
    try {
      await withRetry(
        async () => {
          throw Object.assign(new Error('bad request'), { status: 400 });
        },
        { retries: 3, timeoutMs: 1000 }
      );
      console.error('❌ 4xx 测试失败：应立即抛');
      process.exit(1);
    } catch (e) {
      if (e.status === 400) {
        console.log(`✅ 4xx 不可重试测试通过: ${e.message}`);
      } else {
        console.error(`❌ 4xx 测试失败: ${e.message}`);
        process.exit(1);
      }
    }
  })();
}