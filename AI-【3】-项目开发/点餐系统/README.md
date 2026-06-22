# 点餐系统

基于 Vue3 + Element Plus + Node.js Express + SQLite 的全栈点餐系统。

## 快速启动

```bash
# 1. 安装后端依赖
cd server && npm install && cd ..

# 2. 启动（前后端同时）
npm run dev

# 或分别启动：
# 后端：cd server && node server.js（端口3000）
# 前端：npx vite --port 5173
```

## 功能

- 用户端：菜品浏览、分类筛选、购物车、下单、订单记录
- 管理端：菜品管理、分类管理、订单管理、销售统计
- 技术特点：JWT 鉴权、Pinia 状态管理、SQLite 数据库
