const { spawn } = require('child_process');

const child = spawn('claude', ['-p', 'Say hello and exit'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  console.log('exit code:', code);
});
