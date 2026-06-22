const express = require('express');
const router = express.Router();
const { row, rows, run } = require('../query');

router.get('/', (req, res) => {
  const { category, keyword } = req.query;
  let sql = 'SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON d.category_id = c.id WHERE d.status = 1';
  const params = [];
  if (category) { sql += ' AND d.category_id = ?'; params.push(category); }
  if (keyword) { sql += ' AND d.name LIKE ?'; params.push(`%${keyword}%`); }
  sql += ' ORDER BY d.sales DESC';
  const dishes = rows(sql, params);
  res.json({ code: 200, data: dishes });
});

router.get('/:id', (req, res) => {
  const dish = row('SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON d.category_id = c.id WHERE d.id = ?', [req.params.id]);
  if (!dish) return res.status(404).json({ code: 404, msg: '菜品不存在' });
  res.json({ code: 200, data: dish });
});

module.exports = router;
