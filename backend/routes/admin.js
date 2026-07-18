const express = require('express');
const router = express.Router();
const multer = require('multer');
const { adminAuth } = require('../middleware/adminAuth');
const c = require('../controllers/admin');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.use(adminAuth);

router.get('/dashboard', c.getDashboard);

router.get('/pdfs', c.getPdfs);
router.get('/pdfs/:id', c.getPdf);
router.post('/pdfs', c.createPdf);
router.put('/pdfs/:id', c.updatePdf);
router.delete('/pdfs/:id', c.deletePdf);
router.post('/pdfs/upload', upload.single('file'), c.uploadPdf);

router.get('/colleges', c.getColleges);
router.get('/colleges/:id', c.getCollege);
router.post('/colleges', c.createCollege);
router.post('/colleges/import', upload.single('file'), c.importColleges);
router.post('/colleges/bulk-delete', c.bulkDeleteColleges);
router.put('/colleges/:id', c.updateCollege);
router.delete('/colleges/:id', c.deleteCollege);

router.get('/categories', c.getCategories);
router.post('/categories', c.createCategory);
router.put('/categories/:id', c.updateCategory);
router.delete('/categories/:id', c.deleteCategory);

router.get('/cutoffs', c.getCutoffs);
router.post('/cutoffs', c.createCutoff);
router.post('/cutoffs/import', upload.single('file'), c.importCutoffs);
router.post('/cutoffs/bulk-delete', c.bulkDeleteCutoffs);
router.put('/cutoffs/:id', c.updateCutoff);
router.delete('/cutoffs/:id', c.deleteCutoff);

router.get('/users', c.getUsers);
router.put('/users/:id/role', c.updateUserRole);
router.put('/users/:id/ban', c.banUser);
router.put('/users/:id/unban', c.unbanUser);
router.get('/users/:id/purchases', c.getUserPurchases);
router.post('/users/:id/purchases', c.grantPdfAccess);
router.delete('/users/:id/purchases/:pdfId', c.revokePdfAccess);

router.post('/notifications/broadcast', c.broadcastNotification);
router.post('/notifications/user/:userId', c.sendUserNotification);

router.get('/delivery-requests', c.getDeliveryRequests);
router.put('/delivery-requests/:id', c.updateDeliveryRequest);
router.delete('/delivery-requests/:id', c.deleteDeliveryRequest);

router.get('/settings', c.getSettings);
router.put('/settings', c.updateSettings);

router.get('/payments', c.getPayments);

module.exports = router;
