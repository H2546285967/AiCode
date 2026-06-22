const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ordering-system-secret-key-2024';

function authToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ code: 401, msg: '未登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ code: 401, msg: 'Token过期' });
  }
}

function adminAuth(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ code: 401, msg: '未登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'super') {
      return res.status(403).json({ code: 403, msg: '无权限' });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ code: 401, msg: 'Token过期' });
  }
}

module.exports = { authToken, adminAuth, JWT_SECRET };
