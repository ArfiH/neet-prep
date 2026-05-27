const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { resolveMx } = require('dns/promises');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/db');
const { sendVerificationEmail } = require('../services/email');
const disposableDomains = require('disposable-email-domains');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const issueTokens = (userId, email, tokenVersion = 0) => {
  const accessToken = jwt.sign(
    { userId, email, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Layer 1: Format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const domain = email.split('@')[1].toLowerCase();

    // Layer 2: Disposable email check
    if (disposableDomains.includes(domain)) {
      return res.status(400).json({ error: 'Please use a permanent email address' });
    }

    // Layer 3: MX record check
    try {
      const mx = await resolveMx(domain);
      if (!mx || mx.length === 0) {
        return res.status(400).json({ error: 'This email domain does not exist' });
      }
    } catch {
      return res.status(400).json({ error: 'This email domain does not exist' });
    }

    const [existing] = await pool.query('SELECT id, email_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      if (existing[0].email_verified) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      // Unverified account — resend verification
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        'UPDATE users SET verification_token = ?, password_hash = ?, name = ? WHERE id = ?',
        [verificationToken, await bcrypt.hash(password, 10), name || null, existing[0].id]
      );
      sendVerificationEmail(email, verificationToken).catch(err =>
        console.error('Failed to send verification email:', err)
      );
      return res.status(201).json({
        message: 'Account already exists but is not verified. A new verification email has been sent.',
        email,
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, verification_token, email_verified) VALUES (?, ?, ?, ?, FALSE)',
      [email, passwordHash, name || null, verificationToken]
    );

    sendVerificationEmail(email, verificationToken).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
      email,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, forceLogin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'This account uses Google Sign-In. Please sign in with Google.',
      });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hasActiveSession = user.has_active_session ? true : false;
    if (hasActiveSession && !forceLogin) {
      return res.status(409).json({
        error: 'ACTIVE_SESSION_EXISTS',
        message: 'Another device is already signed in to this account. Continue? That device will be logged out.',
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        email: user.email,
        needs_verification: true,
      });
    }

    const [vRows] = await pool.query('SELECT token_version FROM users WHERE id = ?', [user.id]);
    const tokenVersion = (vRows[0]?.token_version || 0) + 1;

    const { accessToken, refreshToken } = issueTokens(user.id, user.email, tokenVersion);

    await pool.query(
      'UPDATE users SET token_version = ?, has_active_session = TRUE, refresh_token = ? WHERE id = ?',
      [tokenVersion, refreshToken, user.id]
    );

    res.json({
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        category: user.category,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, phone, name, category, email_verified, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [purchases] = await pool.query(
      'SELECT COUNT(*) as count FROM purchases WHERE user_id = ? AND status = "completed"',
      [req.userId]
    );

    res.json({
      ...users[0],
      purchases_count: purchases[0].count,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const [users] = await pool.query(
      'SELECT id, email FROM users WHERE id = ? AND refresh_token = ?',
      [decoded.userId, refreshToken]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const [vRows] = await pool.query('SELECT token_version FROM users WHERE id = ?', [users[0].id]);
    const tokenVersion = vRows[0]?.token_version || 0;

    const accessToken = jwt.sign(
      { userId: users[0].id, email: users[0].email, tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token: accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, category } = req.body;

    const updates = [];
    const values = [];
    if (name !== undefined && name !== '') { updates.push('name = ?'); values.push(name); }
    if (category !== undefined && category !== '') { updates.push('category = ?'); values.push(category); }

    if (updates.length > 0) {
      values.push(req.userId);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyEmailToken = async (token) => {
  if (!token) {
    throw new Error('Verification token is required');
  }

  const [users] = await pool.query(
    'SELECT id, email FROM users WHERE verification_token = ? AND email_verified = FALSE',
    [token]
  );

  if (users.length === 0) {
    throw new Error('Invalid or expired verification token');
  }

  const user = users[0];

  await pool.query(
    'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
    [user.id]
  );

  const [vRows] = await pool.query('SELECT token_version FROM users WHERE id = ?', [user.id]);
  const tokenVersion = (vRows[0]?.token_version || 0) + 1;

  const { accessToken, refreshToken } = issueTokens(user.id, user.email, tokenVersion);

  await pool.query(
    'UPDATE users SET token_version = ?, refresh_token = ? WHERE id = ?',
    [tokenVersion, refreshToken, user.id]
  );

  return { user, accessToken, refreshToken };
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await verifyEmailToken(token);
    res.json({
      message: 'Email verified successfully',
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: { id: result.user.id, email: result.user.email },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    if (error.message === 'Verification token is required') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Invalid or expired verification token') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyEmailWeb = async (req, res) => {
  try {
    const { token } = req.query;
    const result = await verifyEmailToken(token);

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
        <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
          <div style="width:56px;height:56px;border-radius:28px;background:#d8f5e5;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <span style="font-size:28px">✓</span>
          </div>
          <h2 style="color:#1a1d23;margin-bottom:8px">Email Verified!</h2>
          <p style="color:#5f6570;margin-bottom:24px">Your account is now active. You can log in to NEET Zyme.</p>
          <a href="myapp://login" style="display:inline-block;background:#2ea86e;color:#fff;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px">Open NEET Zyme</a>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error('Verify email web error:', error);
    res.setHeader('Content-Type', 'text/html');
    res.status(400).send(`
      <html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;padding:20px">
        <div style="background:#fff;padding:40px;border-radius:20px;max-width:400px;width:100%;text-align:center">
          <div style="width:56px;height:56px;border-radius:28px;background:#fee2e2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <span style="font-size:28px;color:#dc2626">✕</span>
          </div>
          <h2 style="color:#1a1d23;margin-bottom:8px">Verification Failed</h2>
          <p style="color:#5f6570;margin-bottom:8px">${error.message}</p>
          <a href="myapp://login" style="display:inline-block;background:#2ea86e;color:#fff;padding:14px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px">Open NEET Zyme</a>
        </div>
      </body></html>
    `);
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [users] = await pool.query(
      'SELECT id, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    if (users[0].email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      'UPDATE users SET verification_token = ? WHERE id = ?',
      [verificationToken, users[0].id]
    );

    sendVerificationEmail(email, verificationToken).catch(err =>
      console.error('Failed to resend verification email:', err)
    );

    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { idToken, forceLogin } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID token is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleId, email]
    );

    let user;
    if (existing.length > 0) {
      user = existing[0];
      const updates = [];
      const values = [];
      if (!user.google_id) {
        updates.push('google_id = ?');
        values.push(googleId);
      }
      if (!user.email_verified) {
        updates.push('email_verified = TRUE');
      }
      if (updates.length > 0) {
        values.push(user.id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
      }
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (email, name, google_id, email_verified) VALUES (?, ?, ?, TRUE)',
        [email, name || null, googleId]
      );
      user = { id: result.insertId, email, name: name || null, email_verified: true };
    }

    const hasActiveSession = user.has_active_session ? true : false;
    if (hasActiveSession && !forceLogin) {
      return res.status(409).json({
        error: 'ACTIVE_SESSION_EXISTS',
        message: 'Another device is already signed in to this account. Continue? That device will be logged out.',
      });
    }

    const [vRows] = await pool.query('SELECT token_version FROM users WHERE id = ?', [user.id]);
    const tokenVersion = (vRows[0]?.token_version || 0) + 1;

    const { accessToken, refreshToken } = issueTokens(user.id, user.email, tokenVersion);

    await pool.query('UPDATE users SET token_version = ?, has_active_session = TRUE, refresh_token = ? WHERE id = ?', [tokenVersion, refreshToken, user.id]);

    res.json({
      message: 'Google sign-in successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || null,
        category: user.category || null,
        email_verified: true,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

const logout = async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET has_active_session = FALSE, token_version = token_version + 1 WHERE id = ?',
      [req.userId]
    );
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, googleAuth, getProfile, updateProfile, refresh, verifyEmail, verifyEmailWeb, resendVerification, logout };