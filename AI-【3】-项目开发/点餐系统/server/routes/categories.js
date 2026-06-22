const express = require('express');
const router = express.Router();
const { row, rows, run } = require('../query');

router.get('/', (req, res) => {
  const categories = rows('SELECT * FROM categories ORDER BY sort');
  res.json({ code: 200, data: categories });
});

module.exports = router;
