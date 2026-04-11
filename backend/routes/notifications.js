const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, getFacultyStats
} = require('../controllers/notificationController');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);
router.get('/dashboard/faculty', authorize('faculty', 'admin'), getFacultyStats);

module.exports = router;
