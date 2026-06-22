# Dishes.vue 重构为 DishForm.vue + 测试基建

> 由 /dispatch 智能调度（派 2 个 Explore Agent 并行）生成
> 耗时：约 30 秒（vs 串行估计 1.5 分钟，提速 3 倍）

---

## 一、重构方案（Agent 1 输出）

### 拆分边界

**拆到 `src/views/admin/DishForm.vue`**：
- template L22-36：整个 el-dialog + el-form
- script：formData ref、rules、formRef ref、saving ref、handleSave

**留在 `Dishes.vue`**：
- 表格区域 L3-20
- categories 状态、onMounted
- showForm 开关

### Props 接口

| prop | 类型 | 说明 |
|:-----|:-----|:-----|
| modelValue | Boolean | showForm 双向绑定 |
| formData | Object | 表单数据（父组件持有） |
| categories | Array | 分类下拉源 |
| saving | Boolean | loading 透传 |

### Emits

- update:modelValue
- save
- cancel

---

## 二、测试基建方案（Agent 2 输出）

### 安装

```bash
cd H:/AI-han/AiCode/AI-【3】-项目开发/点餐系统
npm install -D vitest @vue/test-utils happy-dom @vitest/ui
```

### 配置文件

新建 `vitest.config.js`：

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
})
```

### package.json scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

### 测试用例清单（9 个）

| # | 用例 | 关键断言 |
|:--|:-----|:---------|
| 1 | 正常渲染 | dialog 打开后 form 字段存在 |
| 2 | name 必填校验 | 空名提交触发错误 |
| 3 | category_id 必填校验 | 未选分类时提交被拦截 |
| 4 | price > 0 校验 | 负数/空值报错 |
| 5 | placeholder 显示 | el-select 包含"请选择菜品分类" |
| 6 | save 事件触发 | 提交后 emit save 带正确数据 |
| 7 | cancel 事件触发 | 点击取消 emit cancel |
| 8 | 编辑模式 | formData 有 id 时标题为"编辑菜品" |
| 9 | categories 加载失败 | reject 时显示错误提示 |

---

## 三、提速效果

| 模式 | 耗时 | 提升 |
|:-----|:-----|:-----|
| 串行（1 个会话查全部） | ~1.5 分钟 | 基准 |
| **/dispatch 并行 2 Agent** | **~30 秒** | **3 倍** |

---

## 四、决策记录

```json
{
  "dispatch": true,
  "agents": 2,
  "reason": "命中\"派子代理\"关键词: \"完整\"",
  "layer": 1,
  "confidence": "high"
}
```

派发理由：用户用了"完整"和"重构"两个强信号 → 自动触发派发 → 1 个 Agent 查代码结构，1 个 Agent 查测试基建 → 主会话汇总成可执行方案。