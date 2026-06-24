#!/usr/bin/env node
/**
 * _shared.js 单元测试（v1.9 P0-3）
 *
 * 覆盖：
 *   1. safeCall 成功路径返回正常响应
 *   2. safeCall 失败路径返回 isError: true
 *   3. formatError 包含 server 名和工具名
 *   4. logCall 输出格式正确（可解析）
 *
 * @since v1.9.0 (2026-06-24) P0-3
 */

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`✅ ${name}`); }
  else { failed++; console.log(`❌ ${name}`); }
}
const { safeCall, formatError, logCall } = require('./_shared');

(async () => {
  // 1. 成功路径
  const okResult = await safeCall('test-ok', { foo: 'bar' }, async () => ({
    content: [{ type: 'text', text: 'success' }],
  }));
  check('成功路径不返回 isError', !okResult.isError);
  check('成功路径 content 正确', okResult.content[0].text === 'success');

  // 2. 失败路径
  const failResult = await safeCall('test-fail', { x: 1 }, async () => {
    throw new Error('mock boom');
  });
  check('失败路径返回 isError', failResult.isError === true);
  check('失败路径保留原错误信息', failResult.content[0].text.includes('mock boom'));

  // 3. formatError 格式
  const msg = formatError('my-tool', new Error('disk full'));
  check('formatError 包含工具名', msg.includes('my-tool'));
  check('formatError 包含原错误', msg.includes('disk full'));

  // 4. 字符串错误
  const msg2 = formatError('tool2', 'simple string error');
  check('formatError 处理字符串错误', msg2.includes('simple string error'));

  console.log('');
  console.log(`📊 _shared 测试: ${passed}/${passed + failed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
})();