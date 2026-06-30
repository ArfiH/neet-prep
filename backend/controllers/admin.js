const { pool } = require('../config/db');
const { sendNotificationEmail } = require('../services/email');

const parsePdf = (pdf) => ({
  ...pdf,
  tags: pdf.tags ? JSON.parse(pdf.tags) : [],
  details: pdf.details ? JSON.parse(pdf.details) : [],
  is_free: Boolean(pdf.is_free),
  is_deliverable: Boolean(pdf.is_deliverable),
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
      'SELECT id, email, name, role, is_banned, email_verified, created_at FROM users ORDER BY id'
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

const banUser = async (req, res) => {
  try {
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

module.exports = {
  getDashboard,
  getPdfs, getPdf, createPdf, updatePdf, deletePdf, uploadPdf,
  getColleges, getCollege, createCollege, updateCollege, deleteCollege,
  getCutoffs, createCutoff, updateCutoff, deleteCutoff,
  getUsers, updateUserRole,
  banUser, unbanUser,
  getUserPurchases, grantPdfAccess, revokePdfAccess,
  broadcastNotification, sendUserNotification,
  getDeliveryRequests, updateDeliveryRequest, deleteDeliveryRequest,
  getSettings, updateSettings,
};
