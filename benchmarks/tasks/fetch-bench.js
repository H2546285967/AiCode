#!/usr/bin/env node
/**
 * Benchmark 任务：网络抓取
 * 抓取 3 个网页
 */

const urls = [
  'https://example.com',
  'https://httpbin.org/get',
  'https://www.wikipedia.org',
];

(async () => {
  let total = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'ai-workspace-bench/1.0' },
      });
      const text = await res.text();
      total += text.length;
    } catch (e) {
      console.error(`fetch failed for ${url}: ${e.message}`);
    }
  }
  console.log(`fetch-bench: ${urls.length} urls, ${total} chars`);
})();
