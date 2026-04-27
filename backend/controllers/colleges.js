const { pool } = require('../config/db');

const parseCollege = (college) => ({
  ...college,
  facilities: college.facilities ? JSON.parse(college.facilities) : [],
});

const getAllColleges = async (req, res) => {
  try {
    const { state, type } = req.query;
    let query = 'SELECT * FROM colleges';
    const params = [];

    if (state || type) {
      const conditions = [];
      if (state && state !== 'All India') {
        conditions.push('state = ?');
        params.push(state);
      }
      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }
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

    res.json({ ...parseCollege(colleges[0]), cutoffs });
  } catch (error) {
    console.error('Get college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const predictColleges = async (req, res) => {
  try {
    const { rank, category, state } = req.query;

    if (!rank) {
      return res.status(400).json({ error: 'Rank is required' });
    }

    const categoryColumn = {
      General: 'general_rank',
      OBC: 'obc_rank',
      SC: 'sc_rank',
      ST: 'st_rank',
    }[category || 'General'];

    let query = `
      SELECT c.*, cu.year, cu.general_rank, cu.obc_rank, cu.sc_rank, cu.st_rank
      FROM colleges c
      INNER JOIN cutoffs cu ON c.id = cu.college_id
      WHERE cu.year = 2024
    `;
    const params = [];

    if (state && state !== 'All India') {
      query += ' AND c.state = ?';
      params.push(state);
    }

    query += ` ORDER BY cu.${categoryColumn} ASC`;

    const [results] = await pool.query(query, params);

    const predictions = [];
    for (const row of results) {
      const cutoffRank = row[categoryColumn] || 999999;
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