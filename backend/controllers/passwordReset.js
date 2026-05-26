const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { sendPasswordResetEmail } = require('../services/email');

const forgotPasswordWeb = async (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
      <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%">
        <h2 style="color:#1a1d23;margin-bottom:8px">Forgot Password</h2>
        <p style="color:#5f6570;margin-bottom:24px">Enter your registered email and we'll send a reset link.</p>
        <form action="/api/auth/forgot-password" method="POST" style="display:flex;flex-direction:column;gap:16px">
          <div>
            <label style="font-size:14px;font-weight:600;color:#1a1d23;display:block;margin-bottom:6px">Email</label>
            <input type="email" name="email" required style="width:100%;padding:14px;border:1px solid #e2e4e8;border-radius:12px;font-size:16px;box-sizing:border-box">
          </div>
          <button type="submit" style="background:#2ea86e;color:#fff;padding:16px;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer">Send Reset Link</button>
        </form>
      </div>
    </body></html>
  `);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    
    // Always return success to prevent email enumeration
    // But actually generate token if user exists
    if (users.length > 0) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Save token to database
      await pool.query(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
        [email, resetToken, expiresAt]
      );

      // Send email (don't await - don't block response)
      sendPasswordResetEmail(email, resetToken).catch(err => {
        console.error('Failed to send reset email:', err);
      });
    }

    // Always return success
    res.json({ 
      message: 'If an account exists with this email, you will receive a password reset link shortly.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find valid token
    const [tokens] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetRecord = tokens[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, resetRecord.email]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_resets SET used = TRUE WHERE id = ?',
      [resetRecord.id]
    );

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPasswordWeb = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
          <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
            <h2 style="color:#dc2626;margin-bottom:8px">Invalid Link</h2>
            <p style="color:#5f6570">Missing reset token.</p>
          </div>
        </body></html>
      `);
    }

    res.send(`
      <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
        <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%">
          <h2 style="color:#1a1d23;margin-bottom:8px">Reset Password</h2>
          <p style="color:#5f6570;margin-bottom:24px">Enter your new password below.</p>
          <form action="/api/auth/reset-password-web-submit" method="POST" style="display:flex;flex-direction:column;gap:16px">
            <input type="hidden" name="token" value="${token}">
            <div>
              <label style="font-size:14px;font-weight:600;color:#1a1d23;display:block;margin-bottom:6px">New Password</label>
              <input type="password" name="newPassword" required minlength="6" style="width:100%;padding:14px;border:1px solid #e2e4e8;border-radius:12px;font-size:16px;box-sizing:border-box">
            </div>
            <button type="submit" style="background:#2ea86e;color:#fff;padding:16px;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer">Reset Password</button>
          </form>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error('Reset password web error:', error);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
        <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
          <h2 style="color:#dc2626;margin-bottom:8px">Error</h2>
          <p style="color:#5f6570">Something went wrong. Please try again.</p>
        </div>
      </body></html>
    `);
  }
};

const resetPasswordWebSubmit = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
          <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
            <h2 style="color:#dc2626;margin-bottom:8px">Error</h2>
            <p style="color:#5f6570">Missing required fields.</p>
          </div>
        </body></html>
      `);
    }

    if (newPassword.length < 6) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
          <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
            <h2 style="color:#dc2626;margin-bottom:8px">Error</h2>
            <p style="color:#5f6570">Password must be at least 6 characters.</p>
          </div>
        </body></html>
      `);
    }

    const [tokens] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
          <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
            <h2 style="color:#dc2626;margin-bottom:8px">Link Expired or Invalid</h2>
            <p style="color:#5f6570;margin-bottom:16px">This reset link is no longer valid.</p>
            <a href="/api/auth/forgot-password" style="color:#2ea86e;font-weight:600;text-decoration:none">Request a new link</a>
          </div>
        </body></html>
      `);
    }

    const resetRecord = tokens[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, resetRecord.email]);
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [resetRecord.id]);

    res.send(`
      <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
        <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
          <div style="width:56px;height:56px;border-radius:28px;background:#d8f5e5;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <span style="font-size:28px">✓</span>
          </div>
          <h2 style="color:#1a1d23;margin-bottom:8px">Password Reset!</h2>
          <p style="color:#5f6570;margin-bottom:24px">Your password has been updated. You can now log in.</p>
          <a href="myapp://login" style="display:inline-block;background:#2ea86e;color:#fff;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px">Open NEET Zyme</a>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error('Reset password web submit error:', error);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
        <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
          <h2 style="color:#dc2626;margin-bottom:8px">Error</h2>
          <p style="color:#5f6570">Something went wrong. Please try again.</p>
        </div>
      </body></html>
    `);
  }
};

module.exports = { forgotPassword, forgotPasswordWeb, resetPassword, resetPasswordWeb, resetPasswordWebSubmit };