require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

const authRoutes = require('./routes/auth');
const pdfRoutes = require('./routes/pdfs');
const collegeRoutes = require('./routes/colleges');
const passwordResetRoutes = require('./routes/passwordReset');
const redirectRoutes = require('./routes/redirect');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api', redirectRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 — catch-all for unhandled routes (return JSON, never HTML)
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

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