const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, refresh, verifyEmail, resendVerification } = require('../controllers/auth');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;