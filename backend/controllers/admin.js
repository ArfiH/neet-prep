const { pool } = require('../config/db');

const parsePdf = (pdf) => ({
  ...pdf,
  tags: pdf.tags ? JSON.parse(pdf.tags) : [],
  details: pdf.details ? JSON.parse(pdf.details) : [],
  is_free: Boolean(pdf.is_free),
});

const getDashboard = async (req, res) => {
  try {
    const [[{ c: pdfCount }]] = await pool.query('SELECT COUNT(*) as c FROM pdfs');
    const [[{ c: collegeCount }]] = await pool.query('SELECT COUNT(*) as c FROM colleges');
    const [[{ c: userCount }]] = await pool.query('SELECT COUNT(*) as c FROM users');
    const [[{ c: purchaseCount }]] = await pool.query("SELECT COUNT(*) as c FROM purchases WHERE status = 'completed'");
    res.json({ pdfCount, collegeCount, userCount, purchaseCount });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPdfs = async (req, res) => {
  try {
    const [pdfs] = await pool.query('SELECT * FROM pdfs ORDER BY created_at DESC');
    res.json(pdfs.map(parsePdf));
  } catch (error) {
    console.error('Admin get PDFs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPdf = async (req, res) => {
  try {
    const [pdfs] = await pool.query('SELECT * FROM pdfs WHERE id = ?', [req.params.id]);
    if (!pdfs.length) return res.status(404).json({ error: 'PDF not found' });
    res.json(parsePdf(pdfs[0]));
  } catch (error) {
    console.error('Admin get PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createPdf = async (req, res) => {
  try {
    const { title, description, subject, author, price, is_free, cover_image_url, file_url, pages_count, tags, details, class: pdfClass } = req.body;
    if (!title || !subject) return res.status(400).json({ error: 'Title and subject are required' });

    const [result] = await pool.query(
      `INSERT INTO pdfs (title, description, subject, author, price, is_free, cover_image_url, file_url, pages_count, tags, details, \`class\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description || '', subject, author || '', price || 0,
        is_free ? 1 : 0, cover_image_url || '', file_url || '',
        pages_count || 0,
        tags ? JSON.stringify(tags) : '[]',
        details ? JSON.stringify(details) : '[]',
        pdfClass || null,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'PDF created' });
  } catch (error) {
    console.error('Admin create PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, author, price, is_free, cover_image_url, file_url, pages_count, tags, details, class: pdfClass } = req.body;

    const [existing] = await pool.query('SELECT id FROM pdfs WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'PDF not found' });

    await pool.query(
      `UPDATE pdfs SET title = ?, description = ?, subject = ?, author = ?, price = ?,
       is_free = ?, cover_image_url = ?, file_url = ?, pages_count = ?, tags = ?, details = ?,
       \`class\` = ?
       WHERE id = ?`,
      [
        title, description || '', subject, author || '', price || 0,
        is_free ? 1 : 0, cover_image_url || '', file_url || '',
        pages_count || 0,
        tags ? JSON.stringify(tags) : '[]',
        details ? JSON.stringify(details) : '[]',
        pdfClass || null,
        id,
      ]
    );
    res.json({ message: 'PDF updated' });
  } catch (error) {
    console.error('Admin update PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deletePdf = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM pdfs WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'PDF not found' });

    await pool.query('DELETE FROM purchases WHERE pdf_id = ?', [req.params.id]);
    await pool.query('DELETE FROM pdfs WHERE id = ?', [req.params.id]);
    res.json({ message: 'PDF deleted' });
  } catch (error) {
    console.error('Admin delete PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getColleges = async (req, res) => {
  try {
    let query = 'SELECT * FROM colleges';
    const params = [];
    if (req.query.state) {
      query += ' WHERE state = ?';
      params.push(req.query.state);
    }
    query += ' ORDER BY name';
    const [colleges] = await pool.query(query, params);
    res.json(colleges.map(c => ({ ...c, facilities: c.facilities ? JSON.parse(c.facilities) : [] })));
  } catch (error) {
    console.error('Admin get colleges error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getCollege = async (req, res) => {
  try {
    const [colleges] = await pool.query('SELECT * FROM colleges WHERE id = ?', [req.params.id]);
    if (!colleges.length) return res.status(404).json({ error: 'College not found' });
    const college = colleges[0];
    college.facilities = college.facilities ? JSON.parse(college.facilities) : [];
    res.json(college);
  } catch (error) {
    console.error('Admin get college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCollege = async (req, res) => {
  try {
    const { name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, facilities, image_url } = req.body;
    if (!name || !state) return res.status(400).json({ error: 'Name and state are required' });

    const [result] = await pool.query(
      `INSERT INTO colleges (name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, facilities, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, state, city || '', type || 'Government', total_seats || 0,
        tuition_fee_annual || 0, hostel_fee_annual || 0, other_charges || 0,
        official_website || '', contact_phone || '', established_year || null,
        accreditation || '', facilities ? JSON.stringify(facilities) : '[]',
        image_url || '']
    );
    res.status(201).json({ id: result.insertId, message: 'College created' });
  } catch (error) {
    console.error('Admin create college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM colleges WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'College not found' });

    const { name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, facilities, image_url } = req.body;

    await pool.query(
      `UPDATE colleges SET name = ?, state = ?, city = ?, type = ?, total_seats = ?,
       tuition_fee_annual = ?, hostel_fee_annual = ?, other_charges = ?,
       official_website = ?, contact_phone = ?, established_year = ?,
       accreditation = ?, facilities = ?, image_url = ? WHERE id = ?`,
      [name, state, city || '', type || 'Government', total_seats || 0,
        tuition_fee_annual || 0, hostel_fee_annual || 0, other_charges || 0,
        official_website || '', contact_phone || '', established_year || null,
        accreditation || '', facilities ? JSON.stringify(facilities) : '[]',
        image_url || '', id]
    );
    res.json({ message: 'College updated' });
  } catch (error) {
    console.error('Admin update college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCollege = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM colleges WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'College not found' });

    await pool.query('DELETE FROM cutoffs WHERE college_id = ?', [req.params.id]);
    await pool.query('DELETE FROM colleges WHERE id = ?', [req.params.id]);
    res.json({ message: 'College deleted' });
  } catch (error) {
    console.error('Admin delete college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getCutoffs = async (req, res) => {
  try {
    let query = `SELECT c.*, col.name AS college_name, col.state AS college_state
                 FROM cutoffs c JOIN colleges col ON c.college_id = col.id`;
    const params = [];
    if (req.query.college_id) {
      query += ' WHERE c.college_id = ?';
      params.push(req.query.college_id);
    }
    query += ' ORDER BY col.name, c.year DESC';
    const [cutoffs] = await pool.query(query, params);
    res.json(cutoffs);
  } catch (error) {
    console.error('Admin get cutoffs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCutoff = async (req, res) => {
  try {
    const { college_id, year, general_rank, obc_rank, sc_rank, st_rank } = req.body;
    if (!college_id || !year) return res.status(400).json({ error: 'College ID and year are required' });

    const [existing] = await pool.query('SELECT id FROM colleges WHERE id = ?', [college_id]);
    if (!existing.length) return res.status(400).json({ error: 'College not found' });

    const [dup] = await pool.query('SELECT id FROM cutoffs WHERE college_id = ? AND year = ?', [college_id, year]);
    if (dup.length) return res.status(409).json({ error: 'Cutoff already exists for this college and year' });

    const [result] = await pool.query(
      'INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank) VALUES (?, ?, ?, ?, ?, ?)',
      [college_id, year, general_rank || 999999, obc_rank || 999999, sc_rank || 999999, st_rank || 999999]
    );
    res.status(201).json({ id: result.insertId, message: 'Cutoff created' });
  } catch (error) {
    console.error('Admin create cutoff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCutoff = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM cutoffs WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Cutoff not found' });

    const { college_id, year, general_rank, obc_rank, sc_rank, st_rank } = req.body;
    await pool.query(
      'UPDATE cutoffs SET college_id = ?, year = ?, general_rank = ?, obc_rank = ?, sc_rank = ?, st_rank = ? WHERE id = ?',
      [college_id, year, general_rank || 999999, obc_rank || 999999, sc_rank || 999999, st_rank || 999999, id]
    );
    res.json({ message: 'Cutoff updated' });
  } catch (error) {
    console.error('Admin update cutoff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCutoff = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM cutoffs WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Cutoff not found' });

    await pool.query('DELETE FROM cutoffs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cutoff deleted' });
  } catch (error) {
    console.error('Admin delete cutoff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at FROM users ORDER BY id'
    );
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'User not found' });

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error('Admin update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getPdfs, getPdf, createPdf, updatePdf, deletePdf,
  getColleges, getCollege, createCollege, updateCollege, deleteCollege,
  getCutoffs, createCutoff, updateCutoff, deleteCutoff,
  getUsers, updateUserRole,
};
