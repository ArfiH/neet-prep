const { pool } = require('../config/db');

const parsePdf = (pdf) => ({
  ...pdf,
  tags: pdf.tags ? JSON.parse(pdf.tags) : [],
  is_free: Boolean(pdf.is_free),
});

const getAllPdfs = async (req, res) => {
  try {
    const [pdfs] = await pool.query('SELECT * FROM pdfs ORDER BY created_at DESC');
    const parsedPdfs = pdfs.map(parsePdf);
    res.json(parsedPdfs);
  } catch (error) {
    console.error('Get PDFs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPdfById = async (req, res) => {
  try {
    const { id } = req.params;
    const [pdfs] = await pool.query('SELECT * FROM pdfs WHERE id = ?', [id]);

    if (pdfs.length === 0) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    try {
      await pool.query('UPDATE pdfs SET downloads = downloads + 1 WHERE id = ?', [id]);
    } catch (counterErr) {
      console.warn('Download counter update failed (non-critical):', counterErr.message);
    }

    res.json(parsePdf(pdfs[0]));
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getPurchasedPdfs = async (req, res) => {
  try {
    const [pdfs] = await pool.query(`
      SELECT p.* FROM pdfs p
      INNER JOIN purchases pr ON p.id = pr.pdf_id
      WHERE pr.user_id = ? AND pr.status = 'completed'
      ORDER BY pr.purchased_at DESC
    `, [req.userId]);

    const parsedPdfs = pdfs.map(parsePdf);
    res.json(parsedPdfs);
  } catch (error) {
    console.error('Get purchased PDFs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const checkPurchase = async (req, res) => {
  try {
    const { pdfId } = req.params;

    const [purchases] = await pool.query(
      'SELECT * FROM purchases WHERE user_id = ? AND pdf_id = ? AND status = "completed"',
      [req.userId, pdfId]
    );

    res.json({ hasPurchased: purchases.length > 0 });
  } catch (error) {
    console.error('Check purchase error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAllPdfs, getPdfById, getPurchasedPdfs, checkPurchase };