const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const issueTokens = (userId, email) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name || null]
    );

    const { accessToken, refreshToken } = issueTokens(result.insertId, email);

    await pool.query(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [refreshToken, result.insertId]
    );

    res.status(201).json({
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: { id: result.insertId, email, name },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = issueTokens(user.id, user.email);

    await pool.query(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [refreshToken, user.id]
    );

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        neet_rank: user.neet_rank,
        category: user.category,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, phone, name, neet_rank, category, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [purchases] = await pool.query(
      'SELECT COUNT(*) as count FROM purchases WHERE user_id = ? AND status = "completed"',
      [req.userId]
    );

    res.json({
      ...users[0],
      purchases_count: purchases[0].count,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const [users] = await pool.query(
      'SELECT id, email FROM users WHERE id = ? AND refresh_token = ?',
      [decoded.userId, refreshToken]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign(
      { userId: users[0].id, email: users[0].email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token: accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, neet_rank, category } = req.body;

    const updates = [];
    const values = [];
    if (name !== undefined && name !== '') { updates.push('name = ?'); values.push(name); }
    if (neet_rank !== undefined && neet_rank !== '') { updates.push('neet_rank = ?'); values.push(neet_rank); }
    if (category !== undefined && category !== '') { updates.push('category = ?'); values.push(category); }

    if (updates.length > 0) {
      values.push(req.userId);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, getProfile, updateProfile, refresh };