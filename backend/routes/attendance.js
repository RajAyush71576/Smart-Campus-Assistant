const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  markAttendance, markBulkAttendance,
  getStudentAttendance, getAttendanceAnalytics, getStudentsList
} = require('../controllers/attendanceController');

router.use(protect);

router.post('/mark', authorize('faculty', 'admin'), markAttendance);
router.post('/bulk', authorize('faculty', 'admin'), markBulkAttendance);
router.get('/students', authorize('faculty', 'admin'), getStudentsList);
router.get('/analytics', authorize('faculty', 'admin'), getAttendanceAnalytics);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
