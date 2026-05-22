const crypto = require('crypto');
const Razorpay = require('razorpay');
const { pool } = require('../config/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
    const { id: pdfId } = req.params;

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

const createOrder = async (req, res) => {
  try {
    const { pdfId } = req.body;
    const userId = req.userId;

    if (!pdfId) {
      return res.status(400).json({ error: 'PDF ID is required' });
    }

    const [pdfs] = await pool.query('SELECT id, price, is_free FROM pdfs WHERE id = ?', [pdfId]);
    if (pdfs.length === 0) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const pdf = pdfs[0];

    if (pdf.is_free) {
      return res.status(400).json({ error: 'This PDF is free, no payment needed' });
    }

    const [existing] = await pool.query(
      'SELECT id, razorpay_order_id, status FROM purchases WHERE user_id = ? AND pdf_id = ? AND status = "completed"',
      [userId, pdfId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already purchased' });
    }

    // Clean up stale pending orders
    await pool.query(
      'DELETE FROM purchases WHERE user_id = ? AND pdf_id = ? AND status = "pending"',
      [userId, pdfId]
    );

    const amountInPaise = Math.round(pdf.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `pdf_${pdfId}_user_${userId}_${Date.now()}`,
      notes: { pdf_id: String(pdfId), user_id: String(userId) },
    });

    await pool.query(
      'INSERT INTO purchases (user_id, pdf_id, razorpay_order_id, amount, status) VALUES (?, ?, ?, ?, ?)',
      [userId, pdfId, order.id, pdf.price, 'pending']
    );

    res.json({
      order_id: order.id,
      amount: pdf.price,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    await pool.query(
      'UPDATE purchases SET status = "completed" WHERE razorpay_order_id = ? AND user_id = ?',
      [razorpay_order_id, userId]
    );

    const [purchases] = await pool.query(
      'SELECT pdf_id FROM purchases WHERE razorpay_order_id = ? AND user_id = ?',
      [razorpay_order_id, userId]
    );

    res.json({
      success: true,
      pdf_id: purchases[0]?.pdf_id,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

const paymentCallback = async (req, res) => {
  try {
    const razorpay_payment_id = req.body?.razorpay_payment_id || req.query?.razorpay_payment_id;
    const razorpay_order_id = req.body?.razorpay_order_id || req.query?.razorpay_order_id;
    const razorpay_signature = req.body?.razorpay_signature || req.query?.razorpay_signature;
    const razorpay_error = req.body?.error;

    if (razorpay_error) {
      const desc = encodeURIComponent(razorpay_error.description || 'Payment failed');
      return res.redirect(`myapp://razorpay-callback?success=false&error=${desc}`);
    }

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.redirect('myapp://razorpay-callback?success=false&error=missing_params');
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.redirect('myapp://razorpay-callback?success=false&error=signature_mismatch');
    }

    await pool.query(
      "UPDATE purchases SET status = 'completed' WHERE razorpay_order_id = ? AND status = 'pending'",
      [razorpay_order_id]
    );

    res.redirect(302, 'myapp://razorpay-callback?success=true');
  } catch (err) {
    console.error('Payment callback error:', err);
    res.redirect('myapp://razorpay-callback?success=false&error=exception');
  }
};

module.exports = { getAllPdfs, getPdfById, getPurchasedPdfs, checkPurchase, createOrder, verifyPayment, paymentCallback };