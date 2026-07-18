const { pool } = require('../config/db');
const { sendNotificationEmail, sendPasswordResetEmail } = require('../services/email');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const parsePdf = (pdf) => ({
  ...pdf,
  tags: pdf.tags ? JSON.parse(pdf.tags) : [],
  details: pdf.details ? JSON.parse(pdf.details) : [],
  is_free: Boolean(pdf.is_free),
  is_deliverable: Boolean(pdf.is_deliverable),
});

const adminMe = async (req, res) => {
  res.json({
    email: req.adminEmail,
    isMainAdmin: req.adminEmail === (process.env.MAIN_ADMIN_EMAIL || 'neetzymee@gmail.com'),
  });
};

const getDashboard = async (req, res) => {
  try {
    const [[{ c: pdfCount }]] = await pool.query('SELECT COUNT(*) as c FROM pdfs');
    const [[{ c: collegeCount }]] = await pool.query('SELECT COUNT(*) as c FROM colleges');
    const [[{ c: userCount }]] = await pool.query('SELECT COUNT(*) as c FROM users');
    const [[{ c: purchaseCount }]] = await pool.query("SELECT COUNT(*) as c FROM purchases WHERE status = 'completed'");
    const [[{ c: monthlyPurchases }]] = await pool.query("SELECT COUNT(*) as c FROM purchases WHERE status = 'completed' AND purchased_at >= DATE_FORMAT(NOW(), '%Y-%m-01')");
    const [monthlyData] = await pool.query(
      `SELECT DATE_FORMAT(purchased_at, '%Y-%m') as month, COUNT(*) as count
       FROM purchases WHERE status = 'completed' AND purchased_at >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 11 MONTH), '%Y-%m-01')
       GROUP BY DATE_FORMAT(purchased_at, '%Y-%m') ORDER BY month ASC`
    );
    res.json({ pdfCount, collegeCount, userCount, purchaseCount, monthlyPurchases, monthlyPurchaseData: monthlyData });
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
    const { title, description, subject, author, price, is_free, cover_image_url, file_url, pages_count, tags, details, class: pdfClass, is_deliverable, category } = req.body;
    if (!title || !subject) return res.status(400).json({ error: 'Title and subject are required' });

    const [result] = await pool.query(
      `INSERT INTO pdfs (title, description, subject, author, price, is_free, cover_image_url, file_url, pages_count, tags, details, \`class\`, is_deliverable, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description || '', subject, author || '', price || 0,
        is_free ? 1 : 0, cover_image_url || '', file_url || '',
        pages_count || 0,
        tags ? JSON.stringify(tags) : '[]',
        details ? JSON.stringify(details) : '[]',
        pdfClass || null,
        is_deliverable ? 1 : 0,
        category || null,
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
    const { title, description, subject, author, price, is_free, cover_image_url, file_url, pages_count, tags, details, class: pdfClass, is_deliverable, category } = req.body;

    const [existing] = await pool.query('SELECT id FROM pdfs WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'PDF not found' });

    await pool.query(
      `UPDATE pdfs SET title = ?, description = ?, subject = ?, author = ?, price = ?,
       is_free = ?, cover_image_url = ?, file_url = ?, pages_count = ?, tags = ?, details = ?,
       \`class\` = ?, is_deliverable = ?, category = ?
       WHERE id = ?`,
      [
        title, description || '', subject, author || '', price || 0,
        is_free ? 1 : 0, cover_image_url || '', file_url || '',
        pages_count || 0,
        tags ? JSON.stringify(tags) : '[]',
        details ? JSON.stringify(details) : '[]',
        pdfClass || null,
        is_deliverable ? 1 : 0,
        category || null,
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
    college.extra_fees = college.extra_fees ? JSON.parse(college.extra_fees) : [];
    res.json(college);
  } catch (error) {
    console.error('Admin get college error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCollege = async (req, res) => {
  try {
    const { name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, facilities, image_url, extra_fees } = req.body;
    if (!name || !state) return res.status(400).json({ error: 'Name and state are required' });
    const sanitizedImage = image_url && !image_url.startsWith('data:') ? image_url : '';

    const [result] = await pool.query(
      `INSERT INTO colleges (name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, facilities, image_url, extra_fees)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, state, city || '', type || 'Government', total_seats || 0,
        tuition_fee_annual || 0, hostel_fee_annual || 0, other_charges || 0,
        official_website || '', contact_phone || '', established_year || null,
        accreditation || 'NMC', facilities ? JSON.stringify(facilities) : '[]',
        sanitizedImage,
        extra_fees && Array.isArray(extra_fees) ? JSON.stringify(extra_fees) : '[]']
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

    const { name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, facilities, image_url, extra_fees } = req.body;
    const sanitizedImage = image_url && !image_url.startsWith('data:') ? image_url : '';

    await pool.query(
      `UPDATE colleges SET name = ?, state = ?, city = ?, type = ?, total_seats = ?,
       tuition_fee_annual = ?, hostel_fee_annual = ?, other_charges = ?,
       official_website = ?, contact_phone = ?, established_year = ?,
       accreditation = ?, facilities = ?, image_url = ?, extra_fees = ? WHERE id = ?`,
      [name, state, city || '', type || 'Government', total_seats || 0,
        tuition_fee_annual || 0, hostel_fee_annual || 0, other_charges || 0,
        official_website || '', contact_phone || '', established_year || null,
        accreditation || 'NMC', facilities ? JSON.stringify(facilities) : '[]',
        sanitizedImage,
        extra_fees && Array.isArray(extra_fees) ? JSON.stringify(extra_fees) : '[]',
        id]
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

const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order, id');
    res.json(rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing.length) return res.status(409).json({ error: 'Category already exists' });
    const [result] = await pool.query('INSERT INTO categories (name, sort_order) VALUES (?, 99)', [name.trim()]);
    res.status(201).json({ id: result.insertId, message: 'Category created' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Category not found' });
    if (name && name.trim()) {
      const [dup] = await pool.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
      if (dup.length) return res.status(409).json({ error: 'Category name already exists' });
    }
    await pool.query(
      'UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?',
      [name?.trim() || null, sort_order ?? null, id]
    );
    res.json({ message: 'Category updated' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Category not found' });
    await pool.query('DELETE FROM cutoff_values WHERE category_id = ?', [id]);
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const attachValues = async (cutoffs) => {
  if (cutoffs.length === 0) return cutoffs;
  const ids = cutoffs.map(c => c.id);
  const placeholders = ids.map(() => '?').join(',');
  const [values] = await pool.query(
    `SELECT cv.*, cat.name AS category_name FROM cutoff_values cv
     JOIN categories cat ON cat.id = cv.category_id
     WHERE cv.cutoff_id IN (${placeholders}) ORDER BY cat.sort_order, cat.id`,
    ids
  );
  const grouped = {};
  for (const v of values) {
    if (!grouped[v.cutoff_id]) grouped[v.cutoff_id] = [];
    grouped[v.cutoff_id].push({ id: v.id, category_id: v.category_id, category_name: v.category_name, rank: v.rank, marks: v.marks });
  }
  return cutoffs.map(c => ({ ...c, values: grouped[c.id] || [] }));
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
    const withValues = await attachValues(cutoffs);
    res.json(withValues);
  } catch (error) {
    console.error('Admin get cutoffs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCutoff = async (req, res) => {
  try {
    const { college_id, year, values } = req.body;
    if (!college_id || !year) return res.status(400).json({ error: 'College ID and year are required' });

    const [existing] = await pool.query('SELECT id FROM colleges WHERE id = ?', [college_id]);
    if (!existing.length) return res.status(400).json({ error: 'College not found' });

    const [dup] = await pool.query('SELECT id FROM cutoffs WHERE college_id = ? AND year = ?', [college_id, year]);
    if (dup.length) return res.status(409).json({ error: 'Cutoff already exists for this college and year' });

    const [result] = await pool.query(
      'INSERT INTO cutoffs (college_id, year) VALUES (?, ?)',
      [college_id, year]
    );
    const cutoffId = result.insertId;

    if (values && values.length > 0) {
      const bulkValues = values.map(v => [cutoffId, v.category_id, v.rank ?? 999999, v.marks ?? null]);
      await pool.query(
        'INSERT INTO cutoff_values (cutoff_id, category_id, rank, marks) VALUES ?',
        [bulkValues]
      );
    }

    res.status(201).json({ id: cutoffId, message: 'Cutoff created' });
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

    const { college_id, year, values } = req.body;
    await pool.query(
      'UPDATE cutoffs SET college_id = ?, year = ? WHERE id = ?',
      [college_id, year, id]
    );

    if (values && values.length > 0) {
      await pool.query('DELETE FROM cutoff_values WHERE cutoff_id = ?', [id]);
      const bulkValues = values.map(v => [id, v.category_id, v.rank ?? 999999, v.marks ?? null]);
      await pool.query(
        'INSERT INTO cutoff_values (cutoff_id, category_id, rank, marks) VALUES ?',
        [bulkValues]
      );
    }

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

    await pool.query('DELETE FROM cutoff_values WHERE cutoff_id = ?', [req.params.id]);
    await pool.query('DELETE FROM cutoffs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cutoff deleted' });
  } catch (error) {
    console.error('Admin delete cutoff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const bulkDeleteColleges = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM cutoffs WHERE college_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM colleges WHERE id IN (${placeholders})`, ids);
    res.json({ deleted: ids.length, message: `${ids.length} college(s) deleted` });
  } catch (error) {
    console.error('Admin bulk delete colleges error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const bulkDeleteCutoffs = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM cutoff_values WHERE cutoff_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM cutoffs WHERE id IN (${placeholders})`, ids);
    res.json({ deleted: ids.length, message: `${ids.length} cutoff(s) deleted` });
  } catch (error) {
    console.error('Admin bulk delete cutoffs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, role, is_banned, email_verified, created_at FROM users ORDER BY id'
    );
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND role = 'admin'",
      [email]
    );

    if (users.length > 0) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await pool.query(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
        [email, resetToken, expiresAt]
      );
      sendPasswordResetEmail(email, resetToken).catch(err =>
        console.error('Failed to send admin reset email:', err)
      );
    }

    res.json({
      message: 'If an admin account exists with this email, you will receive a password reset link shortly.'
    });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const adminChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.adminUserId]);
    if (!users.length) return res.status(404).json({ error: 'Admin not found' });
    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.adminUserId]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    if (req.adminEmail !== (process.env.MAIN_ADMIN_EMAIL || 'neetzymee@gmail.com')) {
      return res.status(403).json({ error: 'Only the main admin can perform this action' });
    }
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

const banUser = async (req, res) => {
  try {
    if (req.adminEmail !== (process.env.MAIN_ADMIN_EMAIL || 'neetzymee@gmail.com')) {
      return res.status(403).json({ error: 'Only the main admin can perform this action' });
    }
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'User not found' });
    if (existing[0].role === 'admin') return res.status(400).json({ error: 'Cannot ban an admin' });

    await pool.query('UPDATE users SET is_banned = 1 WHERE id = ?', [id]);
    res.json({ message: 'User banned' });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const unbanUser = async (req, res) => {
  try {
    if (req.adminEmail !== (process.env.MAIN_ADMIN_EMAIL || 'neetzymee@gmail.com')) {
      return res.status(403).json({ error: 'Only the main admin can perform this action' });
    }
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'User not found' });

    await pool.query('UPDATE users SET is_banned = 0 WHERE id = ?', [id]);
    res.json({ message: 'User unbanned' });
  } catch (error) {
    console.error('Admin unban user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserPurchases = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'User not found' });

    const [purchases] = await pool.query(
      `SELECT p.id, p.pdf_id, p.amount, p.status, p.purchased_at,
              pdf.title AS pdf_title, pdf.subject AS pdf_subject
       FROM purchases p
       JOIN pdfs pdf ON p.pdf_id = pdf.id
       WHERE p.user_id = ?
       ORDER BY p.purchased_at DESC`,
      [id]
    );
    res.json(purchases);
  } catch (error) {
    console.error('Admin get user purchases error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const grantPdfAccess = async (req, res) => {
  try {
    if (req.adminEmail !== (process.env.MAIN_ADMIN_EMAIL || 'neetzymee@gmail.com')) {
      return res.status(403).json({ error: 'Only the main admin can perform this action' });
    }
    const { id } = req.params;
    const { pdf_id } = req.body;
    if (!pdf_id) return res.status(400).json({ error: 'pdf_id is required' });

    const [user] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!user.length) return res.status(404).json({ error: 'User not found' });

    const [pdf] = await pool.query('SELECT id, title FROM pdfs WHERE id = ?', [pdf_id]);
    if (!pdf.length) return res.status(404).json({ error: 'PDF not found' });

    const [dup] = await pool.query(
      'SELECT id FROM purchases WHERE user_id = ? AND pdf_id = ? AND status = ?',
      [id, pdf_id, 'completed']
    );
    if (dup.length) return res.status(409).json({ error: 'User already has access to this PDF' });

    const [result] = await pool.query(
      'INSERT INTO purchases (user_id, pdf_id, status, amount) VALUES (?, ?, ?, ?)',
      [id, pdf_id, 'completed', 0]
    );

    const { createNotification } = require('./notifications');
    createNotification(Number(id), 'Access Granted', `Admin granted you access to "${pdf[0].title}"`).catch(() => {});

    res.status(201).json({ id: result.insertId, message: 'Access granted' });
  } catch (error) {
    console.error('Admin grant PDF access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const uploadPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { buffer, originalname, mimetype } = req.file;
    const crypto = require('crypto');
    const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');

    const { uploadFile } = require('../services/b2');
    const fileUrl = await uploadFile(originalname, mimetype, sha1, buffer);

    res.json({ file_url: fileUrl });
  } catch (error) {
    console.error('Admin upload PDF error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

const revokePdfAccess = async (req, res) => {
  try {
    if (req.adminEmail !== (process.env.MAIN_ADMIN_EMAIL || 'neetzymee@gmail.com')) {
      return res.status(403).json({ error: 'Only the main admin can perform this action' });
    }
    const { id, pdfId } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM purchases WHERE user_id = ? AND pdf_id = ?',
      [id, pdfId]
    );
    if (!existing.length) return res.status(404).json({ error: 'Purchase not found' });

    await pool.query(
      'DELETE FROM purchases WHERE user_id = ? AND pdf_id = ?',
      [id, pdfId]
    );

    const { createNotification } = require('./notifications');
    createNotification(Number(id), 'Access Revoked', `Your access to a PDF has been revoked by admin.`).catch(() => {});

    res.json({ message: 'Access revoked' });
  } catch (error) {
    console.error('Admin revoke PDF access error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const broadcastNotification = async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, body) SELECT id, ?, ? FROM users WHERE is_banned = 0',
      [title.trim(), body?.trim() || '']
    );

    // Send push notifications via Expo Push API
    (async () => {
      try {
        const [tokens] = await pool.query(
          'SELECT DISTINCT dt.expo_push_token FROM device_tokens dt JOIN users u ON dt.user_id = u.id WHERE u.is_banned = 0'
        );
        const pushTokens = tokens.map(t => t.expo_push_token);

        if (pushTokens.length > 0) {
          const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
          const BATCH_SIZE = 100;

          for (let i = 0; i < pushTokens.length; i += BATCH_SIZE) {
            const batch = pushTokens.slice(i, i + BATCH_SIZE);
            try {
              const pushRes = await fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: batch,
                  title: title.trim(),
                  body: body?.trim() || '',
                  sound: 'default',
                  priority: 'high',
                  channelId: 'default',
                }),
              });
              const pushData = await pushRes.json();

              if (pushData.errors) {
                console.error('Expo push API errors:', pushData.errors);
              }

              if (pushData.data) {
                const invalidTokens = pushData.data
                  .filter((receipt, idx) => {
                    if (receipt.status === 'error' && ['DeviceNotRegistered', 'InvalidCredentials', 'MessageTooBig'].includes(receipt.details?.error)) {
                      return true;
                    }
                    return false;
                  })
                  .map((_, idx) => batch[idx])
                  .filter(Boolean);

                if (invalidTokens.length > 0) {
                  pool.query(
                    'DELETE FROM device_tokens WHERE expo_push_token IN (?)',
                    [invalidTokens]
                  ).catch(err => console.error('Error cleaning invalid tokens:', err));
                }
              }
            } catch (batchErr) {
              console.error('Expo push batch error:', batchErr);
            }
          }
        }
      } catch (pushErr) {
        console.error('Push notification error:', pushErr);
      }
    })();

    res.json({ message: `Notification sent to ${result.affectedRows} users` });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const sendUserNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, body } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    // Insert into notifications table
    await pool.query(
      'INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)',
      [userId, title.trim(), body?.trim() || '']
    );

    // Send push notification via Expo Push API (fire-and-forget)
    (async () => {
      try {
        const [tokens] = await pool.query(
          'SELECT expo_push_token FROM device_tokens WHERE user_id = ?',
          [userId]
        );
        const pushTokens = tokens.map(t => t.expo_push_token).filter(Boolean);

        if (pushTokens.length > 0) {
          const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
          const pushRes = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: pushTokens,
              title: title.trim(),
              body: body?.trim() || '',
              sound: 'default',
              priority: 'high',
              channelId: 'default',
            }),
          });
          const pushData = await pushRes.json();
          if (pushData.errors) console.error('Expo push API errors:', pushData.errors);
          if (pushData.data) {
            const invalidTokens = pushData.data
              .filter((receipt) => receipt.status === 'error' && ['DeviceNotRegistered', 'InvalidCredentials', 'MessageTooBig'].includes(receipt.details?.error))
              .map((_, idx) => pushTokens[idx])
              .filter(Boolean);
            if (invalidTokens.length > 0) {
              pool.query('DELETE FROM device_tokens WHERE expo_push_token IN (?)', [invalidTokens])
                .catch(err => console.error('Error cleaning invalid tokens:', err));
            }
          }
        }
      } catch (pushErr) {
        console.error('Push notification error:', pushErr);
      }
    })();

    // Send email (fire-and-forget)
    (async () => {
      try {
        const [[user]] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (user?.email) {
          await sendNotificationEmail(user.email, title.trim(), body?.trim() || '');
        }
      } catch (err) {
        console.error('Send notification email error:', err);
      }
    })();

    res.json({ message: 'Notification sent to user' });
  } catch (error) {
    console.error('Send user notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDeliveryRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT dr.*, p.title AS pdf_title, p.subject AS pdf_subject,
             u.email AS user_email, u.name AS user_name
      FROM delivery_requests dr
      JOIN pdfs p ON dr.pdf_id = p.id
      JOIN users u ON dr.user_id = u.id
      ORDER BY dr.created_at DESC
    `);
    res.json(requests);
  } catch (error) {
    console.error('Get delivery requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteDeliveryRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id, status FROM delivery_requests WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Delivery request not found' });

    const status = existing[0].status;
    if (!['delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Only delivered or cancelled requests can be deleted' });
    }

    await pool.query('DELETE FROM delivery_requests WHERE id = ?', [id]);
    res.json({ message: 'Delivery request deleted' });
  } catch (error) {
    console.error('Delete delivery request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateDeliveryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [existing] = await pool.query('SELECT id FROM delivery_requests WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Delivery request not found' });

    await pool.query('UPDATE delivery_requests SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: `Delivery request ${status}` });
  } catch (error) {
    console.error('Update delivery request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT `key`, `value` FROM settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Admin getSettings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const allowedKeys = ['ad_on_free_read', 'ad_on_free_download'];
    const entries = Object.entries(req.body).filter(([key]) => allowedKeys.includes(key));
    if (!entries.length) return res.status(400).json({ error: 'No valid settings provided' });

    for (const [key, value] of entries) {
      await pool.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, String(value)]
      );
    }

    const [rows] = await pool.query('SELECT `key`, `value` FROM settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Admin updateSettings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page) || 20));
    const status = req.query.status;
    const offset = (page - 1) * perPage;

    let where = '';
    const params = [];
    if (status && ['completed', 'failed', 'pending'].includes(status)) {
      where = 'WHERE p.status = ?';
      params.push(status);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM purchases p ${where}`, params
    );

    const [payments] = await pool.query(
      `SELECT p.id, p.user_id, p.pdf_id, p.razorpay_order_id, p.razorpay_payment_id,
              p.amount, p.status, p.purchased_at,
              u.email AS user_email, u.name AS user_name,
              pdf.title AS pdf_title, pdf.subject AS pdf_subject
       FROM purchases p
       JOIN users u ON p.user_id = u.id
       JOIN pdfs pdf ON p.pdf_id = pdf.id
       ${where}
       ORDER BY p.purchased_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    res.json({
      payments,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const parseCSV = (buffer) => {
  const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[j] || '';
    }
    rows.push(row);
  }
  return { rows, errors: [] };
};

const normalizeRow = (row, aliases) => {
  const out = { ...row };
  for (const [variant, canonical] of Object.entries(aliases)) {
    if (out[variant] && !out[canonical]) out[canonical] = out[variant];
  }
  return out;
};

const importColleges = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const { rows } = parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'No data rows found in CSV' });

    const errors = [];
    const toInsert = [];

    const collegeAliases = {
      totalseats: 'total_seats', seats: 'total_seats',
      tuitionfee: 'tuition_fee_annual', tuitionfeeannual: 'tuition_fee_annual',
      hostelfee: 'hostel_fee_annual', hostelfeeannual: 'hostel_fee_annual',
      othercharges: 'other_charges',
      website: 'official_website',
      phone: 'contact_phone',
      established: 'established_year', year: 'established_year',
      image: 'image_url',
    };

    for (let i = 0; i < rows.length; i++) {
      let r = normalizeRow(rows[i], collegeAliases);
      const rowNum = i + 2;

      if (!r.name) { errors.push({ row: rowNum, reason: 'Name is required' }); continue; }
      if (!r.state) { errors.push({ row: rowNum, reason: 'State is required' }); continue; }

      const validTypes = ['Government', 'Private', 'Deemed', 'Central University', 'State University'];
      const type = r.type && validTypes.includes(r.type) ? r.type : 'Government';

      const sanitizedImage = r.image_url && !r.image_url.startsWith('data:') ? r.image_url : '';

      toInsert.push([
        r.name.trim(), r.state.trim(), r.city?.trim() || '',
        type,
        parseInt(r.total_seats) || 0,
        parseFloat(r.tuition_fee_annual) || 0,
        parseFloat(r.hostel_fee_annual) || 0,
        parseFloat(r.other_charges) || 0,
        r.official_website?.trim() || '',
        r.contact_phone?.trim() || '',
        parseInt(r.established_year) || null,
        r.accreditation?.trim() || 'NMC',
        sanitizedImage,
      ]);
    }

    if (!toInsert.length) {
      return res.json({ imported: 0, errors, message: 'No valid rows to import' });
    }

    const inserted = [];
    for (const row of toInsert) {
      try {
        const [dup] = await pool.query(
          'SELECT id FROM colleges WHERE name = ? AND state = ?',
          [row[0], row[1]]
        );
        if (dup.length) {
          errors.push({ row: '—', reason: `Duplicate skipped: "${row[0]}" in ${row[1]}` });
          continue;
        }

        const [result] = await pool.query(
          `INSERT INTO colleges (name, state, city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges, official_website, contact_phone, established_year, accreditation, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row
        );
        inserted.push(result.insertId);
      } catch (err) {
        errors.push({ row: '—', reason: `"${row[0]}": ${err.message}` });
      }
    }

    res.json({
      imported: inserted.length,
      errors,
      message: `Imported ${inserted.length} of ${toInsert.length} colleges`,
    });
  } catch (error) {
    console.error('Import colleges error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const importCutoffs = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const { rows } = parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'No data rows found in CSV' });

    const errors = [];
    const toInsert = [];

    const cutoffAliases = {
      collegeid: 'college_id',
      generalrank: 'general_rank',
      obcrank: 'obc_rank',
      scrank: 'sc_rank',
      strank: 'st_rank',
      generalmarks: 'general_marks',
      obcmarks: 'obc_marks',
      scmarks: 'sc_marks',
      stmarks: 'st_marks',
    };

    for (let i = 0; i < rows.length; i++) {
      let r = normalizeRow(rows[i], cutoffAliases);
      const rowNum = i + 2;

      if (!r.college_id) { errors.push({ row: rowNum, reason: 'college_id is required' }); continue; }
      if (!r.year) { errors.push({ row: rowNum, reason: 'year is required' }); continue; }

      const collegeId = parseInt(r.college_id);
      const year = parseInt(r.year);

      if (!collegeId || !year) { errors.push({ row: rowNum, reason: 'college_id and year must be numbers' }); continue; }

      const [college] = await pool.query('SELECT id FROM colleges WHERE id = ?', [collegeId]);
      if (!college.length) { errors.push({ row: rowNum, reason: `College ID ${collegeId} not found` }); continue; }

      toInsert.push({
        college_id: collegeId,
        year,
        general_rank: parseInt(r.general_rank) || 999999,
        obc_rank: parseInt(r.obc_rank) || 999999,
        sc_rank: parseInt(r.sc_rank) || 999999,
        st_rank: parseInt(r.st_rank) || 999999,
        general_marks: r.general_marks ? parseInt(r.general_marks) : null,
        obc_marks: r.obc_marks ? parseInt(r.obc_marks) : null,
        sc_marks: r.sc_marks ? parseInt(r.sc_marks) : null,
        st_marks: r.st_marks ? parseInt(r.st_marks) : null,
      });
    }

    if (!toInsert.length) {
      return res.json({ imported: 0, errors, message: 'No valid rows to import' });
    }

    const inserted = [];
    for (const row of toInsert) {
      try {
        const [dup] = await pool.query(
          'SELECT id FROM cutoffs WHERE college_id = ? AND year = ?',
          [row.college_id, row.year]
        );
        if (dup.length) {
          errors.push({ row: '—', reason: `Duplicate skipped: college ${row.college_id}, ${row.year}` });
          continue;
        }

        const [result] = await pool.query(
          'INSERT INTO cutoffs (college_id, year, general_rank, obc_rank, sc_rank, st_rank, general_marks, obc_marks, sc_marks, st_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [row.college_id, row.year, row.general_rank, row.obc_rank, row.sc_rank, row.st_rank, row.general_marks, row.obc_marks, row.sc_marks, row.st_marks]
        );
        const cutoffId = result.insertId;
        const oldToNew = { general_rank: 1, obc_rank: 2, sc_rank: 3, st_rank: 4 };
        const catValues = [];
        for (const [col, catId] of Object.entries(oldToNew)) {
          const rankKey = col;
          const marksKey = col.replace('_rank', '_marks');
          if (row[rankKey] != null && row[rankKey] !== 999999) {
            catValues.push([cutoffId, catId, row[rankKey], row[marksKey] || null]);
          }
        }
        if (catValues.length > 0) {
          await pool.query('INSERT INTO cutoff_values (cutoff_id, category_id, rank, marks) VALUES ?', [catValues]);
        }
        inserted.push(cutoffId);
      } catch (err) {
        errors.push({ row: '—', reason: `college ${row.college_id}, ${row.year}: ${err.message}` });
      }
    }

    res.json({
      imported: inserted.length,
      errors,
      message: `Imported ${inserted.length} of ${toInsert.length} cutoffs`,
    });
  } catch (error) {
    console.error('Import cutoffs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  adminMe,
  getDashboard,
  getPdfs, getPdf, createPdf, updatePdf, deletePdf, uploadPdf,
  getColleges, getCollege, createCollege, updateCollege, deleteCollege, importColleges, bulkDeleteColleges,
  getCutoffs, createCutoff, updateCutoff, deleteCutoff, importCutoffs, bulkDeleteCutoffs,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUsers, adminForgotPassword, adminChangePassword, updateUserRole,
  banUser, unbanUser,
  getUserPurchases, grantPdfAccess, revokePdfAccess,
  broadcastNotification, sendUserNotification,
  getDeliveryRequests, updateDeliveryRequest, deleteDeliveryRequest,
  getSettings, updateSettings,
  getPayments,
};
