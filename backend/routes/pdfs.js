const express = require('express');
const router = express.Router();
const { getAllPdfs, getPdfById, getPurchasedPdfs, checkPurchase, createOrder, verifyPayment, paymentCallback, razorpayWebhook, getPdfViewUrl, serveRawPdf, requestDelivery } = require('../controllers/pdfs');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/', getAllPdfs);
router.post('/razorpay-webhook', razorpayWebhook);
router.get('/:id', getPdfById);
router.get('/:id/check', optionalAuth, checkPurchase);
router.get('/user/purchased', optionalAuth, getPurchasedPdfs);
router.post('/create-order', auth, createOrder);
router.post('/verify-payment', auth, verifyPayment);
router.all('/payment-callback/:pdfId', paymentCallback);
router.get('/:id/view', optionalAuth, getPdfViewUrl);
router.get('/:id/watermarked', auth, serveRawPdf);
router.post('/:id/delivery', auth, requestDelivery);

module.exports = router;