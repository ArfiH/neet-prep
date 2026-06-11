const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getProfile, updateProfile, refresh, verifyEmail, verifyEmailWeb, resendVerification, logout, registerDeviceToken } = require('../controllers/auth');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.get('/verify-email-web', verifyEmailWeb);
router.post('/resend-verification', resendVerification);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/logout', auth, logout);
router.post('/device-token', auth, registerDeviceToken);

module.exports = router;