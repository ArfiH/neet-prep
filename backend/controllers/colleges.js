const { pool } = require('../config/db');

const parseCollege = (college) => ({
  ...college,
  facilities: college.facilities ? JSON.parse(college.facilities) : [],
  extra_fees: college.extra_fees ? JSON.parse(college.extra_fees) : [],
});

const getAllColleges = async (req, res) => {
  try {
    const { state, type, q } = req.query;
    let query = 'SELECT * FROM colleges';
    const params = [];
    const conditions = [];

    if (state && state !== 'All India') {
      conditions.push('state = ?');
      params.push(state);
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (q) {
      conditions.push('name LIKE ?');
      params.push(`%${q}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name';
    const [colleges] = await pool.query(query, params);
    const parsedColleges = colleges.map(parseCollege);
    res.json(parsedColleges);
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getCollegeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [colleges] = await pool.query('SELECT * FROM colleges WHERE id = ?', [id]);

    if (colleges.length === 0) {
      return res.status(404).json({ error: 'College not found' });
    }

    const [cutoffs] = await pool.query(
      'SELECT * FROM cutoffs WHERE college_id = ? ORDER BY year DESC',
      [id]
    );

    const cutoffIds = cutoffs.map(c => c.id);
    if (cutoffIds.length > 0) {
      const placeholders = cutoffIds.map(() => '?').join(',');
      const [values] = await pool.query(
        `SELECT cv.*, cat.name AS category_name FROM cutoff_values cv
         JOIN categories cat ON cat.id = cv.category_id
         WHERE cv.cutoff_id IN (${placeholders}) ORDER BY cat.sort_order, cat.id`,
        cutoffIds
      );
      const grouped = {};
      for (const v of values) {
        if (!grouped[v.cutoff_id]) grouped[v.cutoff_id] = [];
        grouped[v.cutoff_id].push({ id: v.id, category_id: v.category_id, category_name: v.category_name, rank: v.rank, marks: v.marks });
      }
      for (const c of cutoffs) {
        c.values = grouped[c.id] || [];
      }
    }

    res.json({ ...parseCollege(colleges[0]), cutoffs });
  } catch (error) {
    console.error('Get college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const predictColleges = async (req, res) => {
  try {
    const { rank, category, state, type } = req.query;

    if (!rank) {
      return res.status(400).json({ error: 'Rank is required' });
    }

    const [catRows] = await pool.query(
      'SELECT id FROM categories WHERE name = ?',
      [category || 'General']
    );
    if (catRows.length === 0) {
      return res.status(400).json({ error: `Unknown category: ${category || 'General'}` });
    }
    const categoryId = catRows[0].id;

    let query = `
      SELECT c.*, cu.year, cv.rank AS cutoff_rank, cv.marks AS cutoff_marks
      FROM colleges c
      INNER JOIN cutoffs cu ON c.id = cu.college_id
      INNER JOIN cutoff_values cv ON cv.cutoff_id = cu.id AND cv.category_id = ?
      WHERE cu.year = 2024
        AND cv.rank IS NOT NULL AND cv.rank != 999999
    `;
    const params = [categoryId];

    if (state && state !== 'All India') {
      query += ' AND c.state = ?';
      params.push(state);
    }

    if (type && type !== 'All') {
      query += ' AND c.type = ?';
      params.push(type);
    }

    query += ' ORDER BY cv.rank ASC';

    const [results] = await pool.query(query, params);

    const predictions = [];
    for (const row of results) {
      const cutoffRank = row.cutoff_rank || 999999;
      const probability = getProbability(parseInt(rank), cutoffRank);

      if (probability > 0) {
        predictions.push({
          id: row.id,
          name: row.name,
          state: row.state,
          city: row.city,
          type: row.type,
          image_url: row.image_url,
          tuition_fee_annual: row.tuition_fee_annual,
          total_seats: row.total_seats,
          cutoff_rank: cutoffRank,
          probability,
          rank_diff: cutoffRank - parseInt(rank),
        });
      }
    }

    predictions.sort((a, b) => b.probability - a.probability);
    res.json(predictions);
  } catch (error) {
    console.error('Predict colleges error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProbability = (userRank, cutoffRank) => {
  if (userRank <= cutoffRank) return 0.95;
  if (userRank <= cutoffRank + 5000) return 0.7;
  if (userRank <= cutoffRank + 15000) return 0.4;
  if (userRank <= cutoffRank + 30000) return 0.15;
  return 0;
};

module.exports = { getAllColleges, getCollegeById, predictColleges };