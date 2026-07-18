const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { getAllColleges, getCollegeById, predictColleges } = require('../controllers/colleges');

router.get('/', getAllColleges);
router.get('/predict', predictColleges);
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY sort_order, id');
    res.json(rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/:id', getCollegeById);

module.exports = router;