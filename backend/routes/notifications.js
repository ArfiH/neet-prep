const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead } = require('../controllers/notifications');
const { auth } = require('../middleware/auth');

router.get('/', auth, getNotifications);
router.post('/read-all', auth, markAllRead);

module.exports = router;
