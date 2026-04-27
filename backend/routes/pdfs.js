const express = require('express');
const router = express.Router();
const { getAllPdfs, getPdfById, getPurchasedPdfs, checkPurchase } = require('../controllers/pdfs');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/', getAllPdfs);
router.get('/:id', getPdfById);
router.get('/:id/check', optionalAuth, checkPurchase);
router.get('/user/purchased', auth, getPurchasedPdfs);

module.exports = router;