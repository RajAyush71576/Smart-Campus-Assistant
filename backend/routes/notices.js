const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  createNotice, getNotices, getNotice, updateNotice, deleteNotice
} = require('../controllers/noticeController');

router.use(protect);

router.get('/', getNotices);
router.get('/:id', getNotice);
router.post('/', authorize('faculty', 'admin'), upload.single('attachment'), createNotice);
router.put('/:id', authorize('faculty', 'admin'), updateNotice);
router.delete('/:id', authorize('faculty', 'admin'), deleteNotice);

module.exports = router;
