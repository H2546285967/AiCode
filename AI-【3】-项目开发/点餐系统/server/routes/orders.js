const express = require('express');
const router = express.Router();
const { row, rows, run } = require('../query');
const { authToken } = require('../middleware/auth');

router.post('/', authToken, (req, res) => {
  const { items, remark, address, phone } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ code: 400, msg: '请选择菜品' });

  const user = row('SELECT phone, address FROM users WHERE id = ?', [req.user.id]);
  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).slice(2, 6);
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const dish = row('SELECT id, name, price FROM dishes WHERE id = ? AND status = 1', [item.dish_id]);
    if (!dish) return res.status(404).json({ code: 404, msg: `菜品ID ${item.dish_id} 不存在` });
    total += dish.price * (item.quantity || 1);
    orderItems.push({ dish_id: dish.id, dish_name: dish.name, price: dish.price, quantity: item.quantity || 1 });
    run('UPDATE dishes SET sales = sales + ? WHERE id = ?', [item.quantity || 1, dish.id]);
  }

  const result = run(
    'INSERT INTO orders (user_id, order_no, total, status, remark, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, orderNo, total, 'pending', remark || '', address || user.address || '', phone || user.phone || '']
  );

  for (const oi of orderItems) {
    run('INSERT INTO order_items (order_id, dish_id, dish_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
      [result.lastInsertRowid, oi.dish_id, oi.dish_name, oi.price, oi.quantity]);
  }

  run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.json({ code: 200, data: { id: result.lastInsertRowid, order_no: orderNo, total }, msg: '下单成功' });
});

router.get('/', authToken, (req, res) => {
  const orders = rows('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  for (const order of orders) {
    order.items = rows('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  }
  res.json({ code: 200, data: orders });
});

router.get('/:id', authToken, (req, res) => {
  const order = row('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ code: 404, msg: '订单不存在' });
  order.items = rows('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  res.json({ code: 200, data: order });
});

module.exports = router;
