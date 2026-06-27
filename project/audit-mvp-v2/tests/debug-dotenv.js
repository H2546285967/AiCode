// tests/debug-dotenv.js
import 'dotenv/config';
console.log('dotenv 后 USE_MOCK:', JSON.stringify(process.env.USE_MOCK));
console.log('dotenv 后 KIMI_API_KEY 前 10:', (process.env.KIMI_API_KEY || '').slice(0, 10));
console.log('dotenv 后 KIMI_BASE_URL:', process.env.KIMI_BASE_URL);
console.log('dotenv 后 KIMI_MODEL:', process.env.KIMI_MODEL);