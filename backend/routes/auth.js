const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getProfile, updateProfile, refresh, verifyEmail, verifyEmailWeb, resendVerification, logout, registerDeviceToken, sendWhatsappOtp, verifyWhatsappOtp, sendSecondaryPhoneOtp, verifySecondaryPhone } = require('../controllers/auth');
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

// WhatsApp OTP — no auth (pre-login)
router.post('/whatsapp/send-otp', sendWhatsappOtp);
router.post('/whatsapp/verify-otp', verifyWhatsappOtp);

// Secondary phone verification — auth required (existing user)
router.post('/whatsapp/send-secondary', auth, sendSecondaryPhoneOtp);
router.post('/whatsapp/verify-secondary', auth, verifySecondaryPhone);

module.exports = router;