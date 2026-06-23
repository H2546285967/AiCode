#!/usr/bin/env node
/**
 * 真实任务 Benchmark
 * 对比：串行 vs 并行（子进程）执行 3 类真实任务
 *
 * 任务：
 *   1. filesystem: 创建 100 个文件 + 读取
 *   2. sqlite: 插入 1000 条记录 + 查询
 *   3. fetch: 抓取 3 个网页
 *
 * 输出：benchmarks/result.json + benchmarks/result.md
 *
 * @since v1.7.0 (2026-06-22)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BENCHMARK_DIR = path.join(__dirname, '.tmp');
const RESULT_JSON = path.join(__dirname, 'result.json');
const RESULT_MD = path.join(__dirname, 'result.md');

function collectEnv() {
  const cpus = os.cpus();
  return {
    node: process.version,
    platform: process.platform,
    osRelease: os.release(),
    arch: process.arch,
    cpu: cpus.length > 0 ? cpus[0].model : 'unknown',
    cpuCount: cpus.length,
    totalMemoryGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
    shell: process.env.SHELL || process.env.ComSpec || 'unknown',
    gitBash: process.env.MSYSTEM || process.env.MINGW_CHOST || null,
    timestamp: new Date().toISOString(),
  };
}

// 确保临时目录干净
if (fs.existsSync(BENCHMARK_DIR)) {
  fs.rmSync(BENCHMARK_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BENCHMARK_DIR, { recursive: true });

function runTask(name) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const child = spawn('node', [path.join(__dirname, 'tasks', `${name}.js`), BENCHMARK_DIR], {
      stdio: 'pipe',
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      const elapsed = Date.now() - start;
      if (code !== 0) {
        reject(new Error(`${name} failed: ${stderr || stdout}`));
      } else {
        resolve({ name, elapsed, output: stdout.trim() });
      }
    });
  });
}

async function runSerial() {
  const start = Date.now();
  const r1 = await runTask('file-bench');
  const r2 = await runTask('sqlite-bench');
  const r3 = await runTask('fetch-bench');
  const total = Date.now() - start;
  return { mode: 'serial', total, tasks: [r1, r2, r3] };
}

async function runParallel() {
  const start = Date.now();
  const [r1, r2, r3] = await Promise.all([
    runTask('file-bench'),
    runTask('sqlite-bench'),
    runTask('fetch-bench'),
  ]);
  const total = Date.now() - start;
  return { mode: 'parallel', total, tasks: [r1, r2, r3] };
}

(async () => {
  console.log('========================================');
  console.log('📊 真实任务 Benchmark');
  console.log('========================================\n');

  console.log('🔄 跑串行...');
  const serial = await runSerial();

  // 清理 file/sqlite 数据，让并行从同样状态开始
  fs.rmSync(BENCHMARK_DIR, { recursive: true, force: true });
  fs.mkdirSync(BENCHMARK_DIR, { recursive: true });

  console.log('🔄 跑并行...');
  const parallel = await runParallel();

  const improvement = Math.round(((serial.total - parallel.total) / serial.total) * 100);
  const env = collectEnv();

  const result = {
    timestamp: env.timestamp,
    env,
    serial,
    parallel,
    improvement: `${improvement}%`,
  };

  fs.writeFileSync(RESULT_JSON, JSON.stringify(result, null, 2));

  const md = `# Benchmark 结果

**时间**: ${result.timestamp}

## 测试环境

| 项目 | 值 |
|:-----|:---|
| Node.js | ${env.node} |
| 操作系统 | ${env.platform} ${env.osRelease} |
| 架构 | ${env.arch} |
| CPU | ${env.cpu} (${env.cpuCount} 核) |
| 内存 | ${env.totalMemoryGB} GB |
| Shell | ${env.shell}${env.gitBash ? ' (Git Bash)' : ''} |

## 串行

| 任务 | 耗时 (ms) |
|:-----|----------:|
${serial.tasks.map(t => `| ${t.name} | ${t.elapsed} |`).join('\n')}
| **总计** | **${serial.total}** |

## 并行

| 任务 | 耗时 (ms) |
|:-----|----------:|
${parallel.tasks.map(t => `| ${t.name} | ${t.elapsed} |`).join('\n')}
| **总计** | **${parallel.total}** |

## 结论

- 并行比串行快 **${improvement}%**
- 任务：3 个 IO 型任务（文件 + SQLite + 网络）
- 注意：本数字在作者机器上测得，换机器/网络会有差异，建议新环境重跑 \`npm run benchmark\` 建立基线
`;
  fs.writeFileSync(RESULT_MD, md);

  console.log('\n📈 结果:');
  console.log(`  串行总计: ${serial.total} ms`);
  console.log(`  并行总计: ${parallel.total} ms`);
  console.log(`  提升: ${improvement}%`);
  console.log(`\n  详情: ${RESULT_MD}`);

  // 清理
  fs.rmSync(BENCHMARK_DIR, { recursive: true, force: true });
})();
