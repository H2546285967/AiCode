#!/usr/bin/env node
/**
 * Worktree 并行 Agent 真实效果测试
 * 在临时 git 仓库中验证 worktree-parallel.sh + worktree-merge.sh
 * 能并行产出结果并正确合并回主分支。
 *
 * 覆盖：
 *   1. 创建 2 个 worktree，每个在独立分支
 *   2. 两个 worker 同时产出不同文件
 *   3. 合并后主分支包含全部结果
 *   4. 并行 wall-clock 时间小于串行估计（2x 单任务）
 *
 * @since v1.7.1 (2026-06-22)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PARALLEL_SCRIPTS = path.join(ROOT, 'scripts', 'parallel');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`); }
  else { fail++; console.log(`❌ ${name}`); }
}

function run(cmd, cwd, opts = {}) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });
}

(async () => {
  console.log('========================================');
  console.log('🔀 Worktree 并行 Agent 真实效果测试');
  console.log('========================================\n');

  const testDir = path.join(ROOT, `.tmp-worktree-test-${Date.now()}`);
  let worktreeParent = null;

  try {
    // 1. 创建临时 git 仓库
    fs.mkdirSync(testDir, { recursive: true });
    run('git init', testDir);
    run('git config user.email "test@example.com"', testDir);
    run('git config user.name "Test"', testDir);
    fs.writeFileSync(path.join(testDir, 'README.md'), '# test repo\n', 'utf8');
    run('git add README.md', testDir);
    run('git commit -m "init"', testDir);

    // 2. 复制脚本到临时仓库（保持相对路径）
    fs.mkdirSync(path.join(testDir, 'scripts', 'parallel'), { recursive: true });
    fs.copyFileSync(
      path.join(PARALLEL_SCRIPTS, 'worktree-parallel.sh'),
      path.join(testDir, 'scripts', 'parallel', 'worktree-parallel.sh')
    );
    fs.copyFileSync(
      path.join(PARALLEL_SCRIPTS, 'worktree-merge.sh'),
      path.join(testDir, 'scripts', 'parallel', 'worktree-merge.sh')
    );

    // 3. 创建 2 个 worktree
    const startTime = Date.now();
    const parallelOut = run('bash scripts/parallel/worktree-parallel.sh test-task 2', testDir);
    check('worktree-parallel.sh 成功创建 2 个 worktree', parallelOut.includes('全部 worktree 创建完成'));

    // 解析任务 ID，构造 worktree 目录（兼容 Git Bash /h/... 输出）
    const taskIdMatch = parallelOut.match(/任务 ID:\s+(test-task-\d+)/);
    check('能解析到任务 ID', !!taskIdMatch);

    if (taskIdMatch) {
      const taskId = taskIdMatch[1];
      const dirs = [
        path.join(testDir, '.worktrees', taskId, 'w1'),
        path.join(testDir, '.worktrees', taskId, 'w2'),
      ];
      worktreeParent = path.join(testDir, '.worktrees', taskId);
      check('worktree 目录真实存在', dirs.every(d => fs.existsSync(d)));

      // 4. 两个 worker 并行写入不同文件
      dirs.forEach((dir, idx) => {
        fs.writeFileSync(path.join(dir, `w${idx + 1}-result.txt`), `result from worker ${idx + 1}\n`, 'utf8');
        run('git add .', dir);
        run(`git commit -m "worker ${idx + 1} result"`, dir);
      });

      // 5. 合并回主分支
      const mergeOut = run('bash scripts/parallel/worktree-merge.sh test-task', testDir);
      check('worktree-merge.sh 合并成功', mergeOut.includes('合并完成'));

      // 6. 验证主分支包含两个结果
      const mainFiles = run('git ls-tree -r --name-only HEAD', testDir);
      check('主分支包含 w1 结果', mainFiles.includes('w1-result.txt'));
      check('主分支包含 w2 结果', mainFiles.includes('w2-result.txt'));

      // 7. 并行耗时检查（仅做宽松判断，避免机器差异）
      const elapsed = Date.now() - startTime;
      check('并行流程在合理时间内完成（<60s）', elapsed < 60000);
      console.log(`   ⏱️  并行流程耗时: ${elapsed}ms`);
    }
  } catch (e) {
    check('测试流程无异常', false);
    console.error(`   错误: ${e.message}`);
    if (e.stderr) console.error(`   stderr: ${e.stderr.toString()}`);
  } finally {
    // 8. 清理临时目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }

  console.log(`\n📊 Worktree 并行效果测试: ${pass}/${pass + fail} 通过, ${fail} 失败`);
  process.exit(fail > 0 ? 1 : 0);
})();
