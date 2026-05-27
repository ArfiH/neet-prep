const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.query.token;

  if (!token) return res.status(401).json({ error: 'Missing admin token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query(
      'SELECT id, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!users.length || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUserId = users[0].id;
    req.adminEmail = users[0].email;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { adminAuth };
