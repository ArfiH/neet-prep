const express = require('express');
const router = express.Router();
const { getAllPdfs, getPdfById, getPurchasedPdfs, checkPurchase, createOrder, verifyPayment, paymentCallback, getPdfViewUrl, serveWatermarkedPdf } = require('../controllers/pdfs');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/', getAllPdfs);
router.get('/:id', getPdfById);
router.get('/:id/check', optionalAuth, checkPurchase);
router.get('/user/purchased', optionalAuth, getPurchasedPdfs);
router.post('/create-order', auth, createOrder);
router.post('/verify-payment', auth, verifyPayment);
router.all('/payment-callback/:pdfId', paymentCallback);
router.get('/:id/view', optionalAuth, getPdfViewUrl);
router.get('/:id/watermarked', auth, serveWatermarkedPdf);

module.exports = router;