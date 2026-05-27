const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query('SELECT token_version FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const dbVersion = users[0].token_version || 0;
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== dbVersion) {
      return res.status(401).json({
        error: 'SESSION_INVALIDATED',
        message: 'You were logged in on another device.',
      });
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [users] = await pool.query('SELECT token_version FROM users WHERE id = ?', [decoded.userId]);
      if (users.length > 0) {
        const dbVersion = users[0].token_version || 0;
        if (decoded.tokenVersion === undefined || decoded.tokenVersion === dbVersion) {
          req.userId = decoded.userId;
          req.userEmail = decoded.email;
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, optionalAuth };
