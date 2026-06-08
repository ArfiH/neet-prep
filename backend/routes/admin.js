const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const c = require('../controllers/admin');

router.use(adminAuth);

router.get('/dashboard', c.getDashboard);

router.get('/pdfs', c.getPdfs);
router.get('/pdfs/:id', c.getPdf);
router.post('/pdfs', c.createPdf);
router.put('/pdfs/:id', c.updatePdf);
router.delete('/pdfs/:id', c.deletePdf);

router.get('/colleges', c.getColleges);
router.get('/colleges/:id', c.getCollege);
router.post('/colleges', c.createCollege);
router.put('/colleges/:id', c.updateCollege);
router.delete('/colleges/:id', c.deleteCollege);

router.get('/cutoffs', c.getCutoffs);
router.post('/cutoffs', c.createCutoff);
router.put('/cutoffs/:id', c.updateCutoff);
router.delete('/cutoffs/:id', c.deleteCutoff);

router.get('/users', c.getUsers);
router.put('/users/:id/role', c.updateUserRole);
router.put('/users/:id/ban', c.banUser);
router.put('/users/:id/unban', c.unbanUser);
router.get('/users/:id/purchases', c.getUserPurchases);
router.post('/users/:id/purchases', c.grantPdfAccess);
router.delete('/users/:id/purchases/:pdfId', c.revokePdfAccess);

module.exports = router;
