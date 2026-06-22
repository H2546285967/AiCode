const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { row, rows, run } = require('../query');
const { JWT_SECRET, authToken } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { username, password, phone } = req.body;
  if (!username || !password) return res.status(400).json({ code: 400, msg: '用户名和密码必填' });
  const existing = row('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) return res.status(400).json({ code: 400, msg: '用户名已存在' });
  const hash = bcrypt.hashSync(password, 10);
  const result = run('INSERT INTO users (username, password, phone) VALUES (?, ?, ?)', [username, hash, phone || '']);
  const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ code: 200, data: { token, user: { id: result.lastInsertRowid, username } } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = row('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ code: 401, msg: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ code: 200, data: { token, user: { id: user.id, username: user.username, phone: user.phone, address: user.address } } });
});

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const admin = row('SELECT * FROM admins WHERE username = ?', [username]);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ code: 401, msg: '账号或密码错误' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ code: 200, data: { token, admin: { id: admin.id, username: admin.username, role: admin.role } } });
});

router.get('/profile', authToken, (req, res) => {
  const user = row('SELECT id, username, phone, address, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json({ code: 200, data: user });
});

router.put('/profile', authToken, (req, res) => {
  const { phone, address } = req.body;
  run('UPDATE users SET phone = ?, address = ? WHERE id = ?', [phone || '', address || '', req.user.id]);
  res.json({ code: 200, msg: '更新成功' });
});

module.exports = router;
