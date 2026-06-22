const express = require('express');
const router = express.Router();
const { row, rows, run } = require('../query');
const { adminAuth } = require('../middleware/auth');

router.get('/dashboard', adminAuth, (req, res) => {
  const userCount = row('SELECT COUNT(*) as count FROM users');
  const orderCount = row('SELECT COUNT(*) as count FROM orders');
  const dishCount = row('SELECT COUNT(*) as count FROM dishes WHERE status = 1');
  const revenue = row("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != 'cancelled'");
  const dailyOrders = rows("SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as total FROM orders WHERE created_at >= datetime('now', '-7 days') GROUP BY DATE(created_at)");
  const categorySales = rows(`
    SELECT c.name, SUM(oi.quantity) as total FROM order_items oi
    JOIN dishes d ON oi.dish_id = d.id
    JOIN categories c ON d.category_id = c.id
    GROUP BY c.id ORDER BY total DESC
  `);
  res.json({ code: 200, data: { userCount: userCount.count, orderCount: orderCount.count, dishCount: dishCount.count, revenue: revenue.total, dailyOrders, categorySales } });
});

router.get('/dishes', adminAuth, (req, res) => {
  const { page = 1, limit = 10, keyword } = req.query;
  const offset = (page - 1) * limit;
  let countSql = 'SELECT COUNT(*) as count FROM dishes';
  const countParams = [];
  if (keyword) { countSql += ' WHERE name LIKE ?'; countParams.push(`%${keyword}%`); }
  const total = row(countSql, countParams);
  let sql = 'SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON d.category_id = c.id';
  const params = [];
  if (keyword) { sql += ' WHERE d.name LIKE ?'; params.push(`%${keyword}%`); }
  sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  const dishesList = rows(sql, [...params, parseInt(limit), offset]);
  res.json({ code: 200, data: { list: dishesList, total: total.count, page: parseInt(page) } });
});

router.post('/dishes', adminAuth, (req, res) => {
  const { name, category_id, price, image, description, status } = req.body;
  if (!name || !price) return res.status(400).json({ code: 400, msg: '名称和价格必填' });
  if (!category_id) return res.status(400).json({ code: 400, msg: '请选择分类' });
  // 校验分类是否存在（避免外键约束 500）
  const cat = row('SELECT id FROM categories WHERE id = ?', [category_id]);
  if (!cat) return res.status(400).json({ code: 400, msg: '分类不存在' });
  run('INSERT INTO dishes (name, category_id, price, image, description, status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category_id, price, image || '', description || '', status !== undefined ? status : 1]);
  res.json({ code: 200, msg: '添加成功' });
});

router.put('/dishes/:id', adminAuth, (req, res) => {
  const { name, category_id, price, image, description, status } = req.body;
  run('UPDATE dishes SET name=?, category_id=?, price=?, image=?, description=?, status=? WHERE id=?',
    [name, category_id, price, image || '', description || '', status, req.params.id]);
  res.json({ code: 200, msg: '更新成功' });
});

router.delete('/dishes/:id', adminAuth, (req, res) => {
  run('DELETE FROM dishes WHERE id = ?', [req.params.id]);
  res.json({ code: 200, msg: '删除成功' });
});

router.get('/categories', adminAuth, (req, res) => {
  const categories = rows('SELECT * FROM categories ORDER BY sort');
  res.json({ code: 200, data: categories });
});

router.post('/categories', adminAuth, (req, res) => {
  const { name, sort } = req.body;
  run('INSERT INTO categories (name, sort) VALUES (?, ?)', [name, sort || 0]);
  res.json({ code: 200, msg: '添加成功' });
});

router.put('/categories/:id', adminAuth, (req, res) => {
  const { name, sort } = req.body;
  run('UPDATE categories SET name=?, sort=? WHERE id=?', [name, sort, req.params.id]);
  res.json({ code: 200, msg: '更新成功' });
});

router.delete('/categories/:id', adminAuth, (req, res) => {
  run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ code: 200, msg: '删除成功' });
});

router.get('/orders', adminAuth, (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  let sql = 'SELECT o.*, u.username FROM orders o LEFT JOIN users u ON o.user_id = u.id';
  const params = [];
  if (status && status !== 'all') { sql += ' WHERE o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  const countSql = 'SELECT COUNT(*) as count FROM orders' + (status && status !== 'all' ? ' WHERE status = ?' : '');
  const total = row(countSql, status && status !== 'all' ? [status] : []);
  const ordersList = rows(sql, [...params, parseInt(limit), offset]);
  for (const order of ordersList) {
    order.items = rows('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json({ code: 200, data: { list: ordersList, total: total.count, page: parseInt(page) } });
});

router.put('/orders/:id/status', adminAuth, (req, res) => {
  const { status } = req.body;
  run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ code: 200, msg: '状态已更新' });
});

module.exports = router;
