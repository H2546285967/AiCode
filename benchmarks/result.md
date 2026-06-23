# Benchmark 结果

**时间**: 2026-06-22T15:26:26.501Z

## 测试环境

| 项目 | 值 |
|:-----|:---|
| Node.js | v24.16.0 |
| 操作系统 | win32 10.0.19045 |
| 架构 | x64 |
| CPU | 12th Gen Intel(R) Core(TM) i5-12400F (12 核) |
| 内存 | 31.8 GB |
| Shell | I:\Git\Git\usr\bin\bash.exe (Git Bash) |

## 串行

| 任务 | 耗时 (ms) |
|:-----|----------:|
| file-bench | 625 |
| sqlite-bench | 76056 |
| fetch-bench | 16915 |
| **总计** | **93597** |

## 并行

| 任务 | 耗时 (ms) |
|:-----|----------:|
| file-bench | 465 |
| sqlite-bench | 74753 |
| fetch-bench | 15416 |
| **总计** | **74810** |

## 结论

- 并行比串行快 **20%**
- 任务：3 个 IO 型任务（文件 + SQLite + 网络）
- 注意：本数字在作者机器上测得，换机器/网络会有差异，建议新环境重跑 `npm run benchmark` 建立基线
