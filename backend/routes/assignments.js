const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  uploadAssignment, getAssignments, getAssignment,
  trackDownload, deleteAssignment
} = require('../controllers/assignmentController');

router.use(protect);

router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', authorize('faculty', 'admin'), upload.single('file'), uploadAssignment);
router.post('/:id/download', trackDownload);
router.delete('/:id', authorize('faculty', 'admin'), deleteAssignment);

module.exports = router;
