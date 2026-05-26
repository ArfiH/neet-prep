const { pool } = require('../config/db');

// GET /api/notifications — list for current user
const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, body, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/notifications/read-all — mark all as read
const markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Internal helper — called by other controllers
const createNotification = async (userId, title, body) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)',
      [userId, title, body]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// POST /api/notifications/:id/read — mark single notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getNotifications, markAllRead, markAsRead, createNotification };
