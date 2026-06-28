#!/usr/bin/env node
/**
 * mem-poc CLI — M39 借鉴 thedotmack/claude-mem 的命令行入口
 *
 * 子命令：
 *   compress   压缩磁盘所有 session 为高密度摘要
 *   inject     基于 query 注入最相关的历史事件
 *   demo       端到端 demo（压缩 → 注入一个示例 query）
 *
 * @since v3.0.5 M39 (2026-06-28)
 */

'use strict';

const path = require('path');
const { compressFromDisk, compressSessions, loadAllSessions } = require('./mem-compress');
const { injectRelevant } = require('./mem-inject');

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

try {
  switch (cmd) {
    case 'compress': {
      const result = compressFromDisk(arg2 ? JSON.parse(arg2) : {});
      console.log(result.markdown);
      console.error(`\n[stats] events=${result.events.length} dateRange=${result.dateRange ? `${result.dateRange.from} → ${result.dateRange.to}` : 'N/A'}`);
      break;
    }
    case 'inject': {
      if (!arg1) {
        console.log('用法: node mem-poc.js inject "<query>" [topK]');
        process.exit(1);
      }
      const opts = arg2 ? { topK: parseInt(arg2, 10) } : {};
      const result = injectRelevant(arg1, opts);
      console.log(result.summary);
      console.error(`\n[stats] returned=${result.stats.returned}/${result.stats.totalEvents} · avgRel=${(result.stats.avgRelevance * 100).toFixed(0)}% · saved≈${result.stats.charSaved} chars`);
      break;
    }
    case 'demo': {
      console.log('━━━ M39 demo: 压缩 → 注入 ━━━\n');
      const compressed = compressFromDisk();
      console.log('[1] 压缩后:');
      console.log(compressed.markdown.slice(0, 600));
      console.log(`\n... (共 ${compressed.events.length} 事件)\n`);

      const query = arg1 || '下一步做什么';
      const injected = injectRelevant(query);
      console.log(`[2] 注入 query="${query}":`);
      console.log(injected.summary);
      console.error(`\n[stats] returned=${injected.stats.returned}/${injected.stats.totalEvents} · totalChars=${injected.totalChars} · saved≈${injected.stats.charSaved} chars`);
      break;
    }
    case 'sessions': {
      const sessions = loadAllSessions();
      console.log(`已加载 ${sessions.length} 个 session:`);
      sessions.forEach(s => console.log(`  - ${s.id} (${s.file})`));
      break;
    }
    default: {
      console.log(`
mem-poc.js — M39 借鉴 thedotmack/claude-mem POC

用法:
  compress [opts-json]    压缩磁盘所有 session
  inject "<query>" [topK] 基于 query 注入相关历史
  demo [query]            端到端 demo
  sessions                列出磁盘上的 session

opts-json 例子: '{"topK": 5, "maxChars": 1000}'

参考:
  mem-compress.js  启发式压缩（不调 LLM）
  mem-inject.js    相关性 + 时间衰减 + 类别权重注入
`);
    }
  }
} catch (e) {
  console.error('❌ 异常:', e.message);
  process.exit(1);
}