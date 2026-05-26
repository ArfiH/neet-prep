const express = require('express');
const router = express.Router();
const { forgotPassword, forgotPasswordWeb, resetPassword, resetPasswordWeb, resetPasswordWebSubmit } = require('../controllers/passwordReset');

router.get('/forgot-password', forgotPasswordWeb);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/reset-password-web', resetPasswordWeb);
router.post('/reset-password-web-submit', resetPasswordWebSubmit);

module.exports = router;