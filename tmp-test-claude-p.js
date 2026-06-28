const { spawn } = require('child_process');
const path = require('path');

function resolveClaudeBin() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  if (process.platform === 'win32') {
    const roaming = process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'claude.cmd');
    if (roaming && require('fs').existsSync(roaming)) return roaming;
    return 'claude';
  }
  return 'claude';
}

const child = spawn(resolveClaudeBin(), ['-p', 'Say hello and exit'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  console.log('exit code:', code);
});

child.on('error', (err) => {
  console.error('spawn error:', err.message);
});
