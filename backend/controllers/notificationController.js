const Notification = require('../models/Notification');

// @desc   Get user notifications
// @route  GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('sender', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark notification as read
// @route  PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark all as read
// @route  PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete notification
// @route  DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get dashboard stats (Faculty)
// @route  GET /api/dashboard/faculty
exports.getFacultyStats = async (req, res) => {
  try {
    const Assignment = require('../models/Assignment');
    const Notice = require('../models/Notice');
    const Attendance = require('../models/Attendance');
    const User = require('../models/User');

    const [assignmentCount, noticeCount, studentCount, recentAttendance] = await Promise.all([
      Assignment.countDocuments({ faculty: req.user._id, isActive: true }),
      Notice.countDocuments({ author: req.user._id, isActive: true }),
      User.countDocuments({ role: 'student', department: req.user.department, isActive: true }),
      Attendance.find({ faculty: req.user._id })
        .sort({ date: -1 })
        .limit(10)
        .populate('student', 'name rollNumber'),
    ]);

    res.json({
      success: true,
      stats: { assignmentCount, noticeCount, studentCount },
      recentAttendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
