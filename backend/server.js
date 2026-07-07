require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdfs');
const collegeRoutes = require('./routes/colleges');
const passwordResetRoutes = require('./routes/passwordReset');
const redirectRoutes = require('./routes/redirect');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const checkoutRoutes = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Logging middleware
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`;
    if (res.statusCode >= 400) {
      console.error(log);
    } else {
      console.log(log);
    }
  });
  next();
});

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api', passwordResetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', redirectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/settings', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const [rows] = await pool.query('SELECT `key`, `value` FROM settings WHERE `key` IN (?, ?)', ['ad_on_free_read', 'ad_on_free_download']);
    const settings = { ad_on_free_read: '1', ad_on_free_download: '1' };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  } catch (error) {
    console.error('Public settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// Admin React SPA  (served at /admin)
// ---------------------------------------------------------------------------
const adminDist = path.join(__dirname, 'admin-dist');
if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDist, 'index.html'));
  });
} else {
  console.warn('[server] admin-dist not found — admin panel disabled');
}

// ---------------------------------------------------------------------------
// Website React SPA   (served at /         — public-facing site)
// ---------------------------------------------------------------------------
const webDist = path.join(__dirname, 'web-dist');
let webDistExists = false;

if (fs.existsSync(webDist)) {
  webDistExists = true;
  // Serve static assets first (JS, CSS, images)
  app.use(express.static(webDist));

  // SPA fallback: serve index.html for any non-API, non-admin GET request
  app.get('*', (req, res, next) => {
    // Skip API and admin routes — let them reach the 404 handler instead
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) {
      return next();
    }
    res.sendFile(path.join(webDist, 'index.html'), (err) => {
      if (err) {
        console.error('[server] Failed to serve web-dist/index.html:', err.message);
        res.status(500).send('Server error');
      }
    });
  });
} else {
  console.warn('[server] web-dist not found — website SPA disabled');
}

// ---------------------------------------------------------------------------
// 404 — only for /api/* routes (returns JSON, never HTML)
// ---------------------------------------------------------------------------
if (webDistExists) {
  // If website exists, only API routes get JSON 404
  app.use('/api/*', (req, res) => {
    console.error(`[404] API route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });
} else {
  // Without website, keep the old catch-all for backward compat
  app.use((req, res) => {
    console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  if (process.env.NODE_ENV !== 'production') {
    // Get local IP for physical device access (dev only)
    const networkInterfaces = require('os').networkInterfaces();
    let localIP = 'localhost';
    for (const interfaceName of Object.keys(networkInterfaces)) {
      for (const iface of networkInterfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🚀 Server running on http://${localIP}:${PORT} (for physical device)`);
  } else {
    console.log(`🚀 Server running on port ${PORT} (production)`);
  }
  await testConnection();
});

module.exports = app;