// tests/debug-env.js
console.log('USE_MOCK:', JSON.stringify(process.env.USE_MOCK));
console.log('KIMI_API_KEY 前 10 字符:', (process.env.KIMI_API_KEY || '').slice(0, 10));
console.log('KIMI_BASE_URL:', process.env.KIMI_BASE_URL);
console.log('KIMI_MODEL:', process.env.KIMI_MODEL);
console.log('判定 USE_MOCK:', process.env.USE_MOCK === 'true' || !process.env.KIMI_API_KEY);