const express = require('express');
const router = express.Router();
const { row, rows, run } = require('../query');
const { authToken } = require('../middleware/auth');

router.get('/', authToken, (req, res) => {
  const cart = rows('SELECT ci.*, d.name, d.image, d.price, d.status FROM cart_items ci JOIN dishes d ON ci.dish_id = d.id WHERE ci.user_id = ?', [req.user.id]);
  res.json({ code: 200, data: cart });
});

router.post('/', authToken, (req, res) => {
  const { dish_id, quantity = 1 } = req.body;
  const dish = row('SELECT id, price, name FROM dishes WHERE id = ? AND status = 1', [dish_id]);
  if (!dish) return res.status(404).json({ code: 404, msg: '菜品不存在或已下架' });
  const existing = row('SELECT id, quantity FROM cart_items WHERE user_id = ? AND dish_id = ?', [req.user.id, dish_id]);
  if (existing) {
    run('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
  } else {
    run('INSERT INTO cart_items (user_id, dish_id, quantity, price) VALUES (?, ?, ?, ?)', [req.user.id, dish_id, quantity, dish.price]);
  }
  res.json({ code: 200, msg: '已加入购物车' });
});

router.put('/:id', authToken, (req, res) => {
  const { quantity } = req.body;
  run('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
  res.json({ code: 200, msg: '更新成功' });
});

router.delete('/:id', authToken, (req, res) => {
  run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ code: 200, msg: '已删除' });
});

router.delete('/', authToken, (req, res) => {
  run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.json({ code: 200, msg: '购物车已清空' });
});

module.exports = router;
