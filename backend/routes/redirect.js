const express = require('express');
const router = express.Router();

const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ahmad.neetzyme';

const redirectPage = (deepLinkPath, webPath, token, title, description, webLabel) => {
  const deepLink = `myapp://${deepLinkPath}?token=${token}`;
  const webUrl = `/api/auth/${webPath}?token=${token}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – NEET Zyme</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; padding: 20px; }
    .card { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; max-width: 400px; width: 100%; }
    h1 { color: #1a1d23; font-size: 22px; margin-bottom: 8px; }
    p { color: #5f6570; font-size: 15px; line-height: 1.5; margin-bottom: 8px; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e4e8; border-top-color: #2ea86e; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 24px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status-text { font-size: 13px; color: #9CA3AF; margin-bottom: 8px; }
    .fallback { margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e4e8; display: none; }
    .btn { display: block; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 10px; }
    .btn-primary { background: #2ea86e; color: #fff; }
    .btn-outline { background: #f4f5f7; color: #1a1d23; }
    .btn-link { color: #2ea86e; font-weight: 600; text-decoration: none; font-size: 14px; }
    .help-text { font-size: 13px; color: #9CA3AF; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${description}</p>
    <div class="spinner"></div>
    <div class="status-text">Opening NEET Zyme...</div>

    <div class="fallback" id="fallback">
      <p style="margin-bottom:16px">Couldn't open the app automatically.</p>
      <a href="${deepLink}" class="btn btn-primary">Try Opening App Again</a>
      <a href="${webUrl}" class="btn btn-outline">${webLabel}</a>
      <a href="${ANDROID_STORE_URL}" class="btn-link">Download from Play Store</a>
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
    'verify-email-web',
    token,
    'Verify Your Email',
    'Click below to verify your email address and activate your NEET Zyme account.',
    'Verify in Browser'
  ));
});

router.get('/redirect/reset-password', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  res.setHeader('Content-Type', 'text/html');
  res.send(redirectPage(
    'reset-password',
    'reset-password-web',
    token,
    'Reset Your Password',
    'Click below to open the app and reset your password.',
    'Reset in Browser'
  ));
});

module.exports = router;
