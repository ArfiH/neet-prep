const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markAsRead } = require('../controllers/notifications');
const { auth } = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.post('/read-all', auth, markAllRead);
router.post('/:id/read', auth, markAsRead);

module.exports = router;
