#!/usr/bin/env node
/**
 * autonomous-menu.js — /autonomous 交互式方向键菜单（v3.0.6）
 *
 * 运行：npm run autonomous
 * 效果：弹出上下方向键可选菜单，回车确认后自动执行对应模式。
 *
 * 选项：
 *   - single : 开启 single 模式并启动 runner
 *   - always : 开启 always 模式并启动 runner
 *   - on     : 只开启开关（默认 always，不启动 runner）
 *   - off    : 关闭开关
 *
 * 技术：零依赖，使用 Node.js 内置 readline + ANSI 转义码。
 */

const readline = require('readline');
const childProcess = require('child_process');
const path = require('path');
const autonomous = require('./autonomous.js');

const WORKSPACE_ROOT = path.join(__dirname, '..', '..');

const choices = [
  { key: 'single', label: 'single   - 完成当前 1 个阶段后自动停止', run: true, mode: 'single' },
  { key: 'always', label: 'always   - 循环执行阶段（离开时用）', run: true, mode: 'always' },
  { key: 'on',     label: 'on       - 只开开关，不启动 runner', run: false, mode: 'always' },
  { key: 'off',    label: 'off      - 关闭自主模式', run: false, mode: null },
];

const ANSI = {
  clearLine: '\x1b[2K',
  cursorUp: (n) => `\x1b[${n}A`,
  cursorHide: '\x1b[?25l',
  cursorShow: '\x1b[?25h',
  reset: '\x1b[0m',
  inverse: '\x1b[7m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
};

let selected = 0;
let isRunning = true;

function render() {
  let out = '\n';
  out += `${ANSI.cyan}?${ANSI.reset} 选择自主模式 ${ANSI.gray}(↑↓ 移动，↵ 确认)${ANSI.reset}\n`;
  choices.forEach((choice, idx) => {
    const prefix = idx === selected ? `${ANSI.inverse} ❯ ${choice.key.padEnd(6)}${ANSI.reset}` : `   ${choice.key.padEnd(6)}`;
    out += `${prefix} ${choice.label}\n`;
  });
  out += '\n';
  process.stdout.write(out);
}

function clearRender() {
  // 清除已渲染的菜单（标题 + 4 选项 + 前后空行 = 7 行）
  const lines = choices.length + 3;
  process.stdout.write(ANSI.cursorUp(lines));
  for (let i = 0; i < lines; i++) {
    process.stdout.write(ANSI.clearLine + '\n');
  }
  process.stdout.write(ANSI.cursorUp(lines));
}

function cleanup() {
  if (!isRunning) return;
  isRunning = false;
  process.stdout.write(ANSI.cursorShow);
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
}

function startRunner(mode) {
  console.log(`\n🤖 自主模式已开启（${mode}），正在启动 runner...\n`);
  const runnerPath = path.join(__dirname, 'autonomous-runner.js');
  const child = childProcess.spawn('node', [runnerPath, 'run'], {
    cwd: WORKSPACE_ROOT,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

function executeChoice(choice) {
  clearRender();
  if (choice.key === 'off') {
    autonomous.disable();
    console.log('\n🙋 已切回正常模式（逐步确认）');
    cleanup();
    process.exit(0);
    return;
  }

  const state = autonomous.enable({ mode: choice.mode, by: 'user' });
  console.log(`\n🤖 自主模式已开启（${state.mode}）`);
  if (state.enabled_at) console.log(`   开启时间: ${state.enabled_at}`);

  if (choice.run) {
    startRunner(state.mode);
  } else {
    cleanup();
    process.exit(0);
  }
}

function main() {
  if (!process.stdin.isTTY) {
    // 非 TTY（如管道/重定向）回退到 status
    console.log('非交互式环境，无法显示菜单。用法示例：');
    console.log('  npm run autonomous:single');
    console.log('  npm run autonomous:always');
    console.log('  npm run autonomous:on');
    console.log('  npm run autonomous:off');
    process.exit(1);
  }

  process.stdout.write(ANSI.cursorHide);
  render();

  process.stdin.setRawMode(true);
  readline.emitKeypressEvents(process.stdin);

  process.stdin.on('keypress', (str, key) => {
    if (!isRunning) return;

    if (key.name === 'up') {
      selected = (selected - 1 + choices.length) % choices.length;
      clearRender();
      render();
    } else if (key.name === 'down') {
      selected = (selected + 1) % choices.length;
      clearRender();
      render();
    } else if (key.name === 'return' || key.name === 'enter') {
      executeChoice(choices[selected]);
    } else if (key.name === 'c' && key.ctrl) {
      cleanup();
      process.exit(0);
    }
  });

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
}

if (require.main === module) {
  main();
}

module.exports = { choices, render, executeChoice, clearRender };
