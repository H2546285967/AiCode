#!/usr/bin/env node
/**
 * prompt-optimizer/cli.js
 * 命令行入口
 *
 * 用法：
 *   node scripts/prompt-optimizer/cli.js --file .claude/agents/qa-reviewer.md --rounds 3
 *   node scripts/prompt-optimizer/cli.js --text "Summarize this."
 *   node scripts/prompt-optimizer/cli.js --file ... --json
 *
 * @since v3.0.8 (2026-07-01) M54 Phase 2
 */

const fs = require('fs');
const path = require('path');
const { run, formatReport } = require('./pipeline');

function parseArgs(argv) {
  const args = {
    file: null,
    text: null,
    rounds: 3,
    json: false,
    backends: 'heuristic',
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--file':
        args.file = argv[++i];
        break;
      case '--text':
        args.text = argv[++i];
        break;
      case '--rounds':
        args.rounds = parseInt(argv[++i], 10);
        break;
      case '--backends':
        args.backends = argv[++i];
        break;
      case '--json':
        args.json = true;
        break;
      case '--help':
      case '-h':
        console.log(`Usage: node cli.js [options]
  --file <path>      Prompt file to optimize
  --text <string>     Raw prompt text
  --rounds <n>       Max optimization rounds (default 3)
  --backends <list>   Comma-separated backend names (default heuristic)
  --json              Output JSON instead of markdown
  --help              Show this help`);
        process.exit(0);
        break;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  let prompt;
  if (args.file) {
    const fp = path.resolve(args.file);
    if (!fs.existsSync(fp)) {
      console.error(`File not found: ${fp}`);
      process.exit(1);
    }
    prompt = fs.readFileSync(fp, 'utf8');
  } else if (args.text) {
    prompt = args.text;
  } else {
    console.error('Please provide --file or --text');
    process.exit(1);
  }

  const result = await run(prompt, {
    rounds: args.rounds,
    backends: args.backends.split(',').map(s => s.trim()).filter(Boolean),
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatReport(result));
  }
}

main().catch((e) => {
  console.error(`❌ prompt-optimizer failed: ${e.message}`);
  process.exit(1);
});
