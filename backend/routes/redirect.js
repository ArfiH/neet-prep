const express = require('express');
const router = express.Router();

const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ahmad.neetzyme';

const redirectPage = (deepLinkPath, token, title, description) => {
  const deepLink = `myapp://${deepLinkPath}?token=${token}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; max-width: 400px; }
    h1 { color: #1a1d23; font-size: 22px; margin-bottom: 8px; }
    p { color: #5f6570; font-size: 15px; line-height: 1.5; margin-bottom: 20px; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e4e8; border-top-color: #2ea86e; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 20px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fallback { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e4e8; display: none; }
    .fallback a { color: #2ea86e; text-decoration: none; font-weight: 600; }
    .fallback a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${description}</p>
    <div class="spinner"></div>
    <p style="font-size: 13px; color: #9CA3AF;">Opening NEET Zyme...</p>
    <div class="fallback" id="fallback">
      <p style="font-size: 14px;">App not opening?</p>
      <p style="margin-bottom: 12px;"><a href="${deepLink}">Tap here to open manually</a></p>
      <p>Download the app: <a href="${ANDROID_STORE_URL}">Play Store</a></p>
    </div>
  </div>
  <script>
    var start = Date.now();
    window.location.href = '${deepLink}';
    setTimeout(function() {
      if (Date.now() - start < 2500) {
        document.getElementById('fallback').style.display = 'block';
      }
    }, 2000);
  </script>
</body>
</html>`;
};

router.get('/redirect/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  res.setHeader('Content-Type', 'text/html');
  res.send(redirectPage(
    'verify-email',
    token,
    'Verify Your Email',
    'Click below to verify your email address and activate your NEET Zyme account.'
  ));
});

router.get('/redirect/reset-password', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  res.setHeader('Content-Type', 'text/html');
  res.send(redirectPage(
    'reset-password',
    token,
    'Reset Your Password',
    'Click below to open the app and reset your password.'
  ));
});

module.exports = router;
