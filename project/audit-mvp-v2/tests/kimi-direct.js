// tests/kimi-direct.js
// 直接调 Kimi，不走 server，验证 Key 是否有效
import 'dotenv/config';
import OpenAI from 'openai';

const key = process.env.KIMI_API_KEY;
console.log('Key 前缀:', key?.slice(0, 15));
console.log('Key 长度:', key?.length);
console.log('---');

const client = new OpenAI({
  apiKey: key,
  baseURL: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
});

// 测试模型列表
const modelsToTest = [
  'moonshot-v1-8k',
  'moonshot-v1-8k-vision-preview',
  'moonshot-v1-32k-vision-preview',
  'moonshot-v1-128k',
  'kimi-k2-0905-preview',
];

for (const model of modelsToTest) {
  process.stdout.write(`🔍 ${model.padEnd(38)} ... `);
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 50,
      messages: [{ role: 'user', content: '说"OK"' }],
    });
    console.log(`✅ ${res.choices[0].message.content.trim()}`);
  } catch (err) {
    console.log(`❌ ${err.status || ''} ${err.message?.slice(0, 80)}`);
  }
}