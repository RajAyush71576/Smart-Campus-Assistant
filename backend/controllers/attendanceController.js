const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc   Mark attendance for a student (Faculty only)
// @route  POST /api/attendance/mark
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, subject, date, status, remarks } = req.body;
    const faculty = req.user;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const attendanceDate = new Date(date || Date.now());
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, subject, date: attendanceDate },
      { student: studentId, faculty: faculty._id, subject, date: attendanceDate, status, remarks, department: student.department, semester: student.semester },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Create real-time notification
    const notification = await Notification.create({
      recipient: studentId,
      sender: faculty._id,
      type: 'attendance',
      title: 'Attendance Marked',
      message: `Your attendance for ${subject} on ${attendanceDate.toDateString()} has been marked as ${status}.`,
      link: '/attendance',
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${studentId}`).emit('notification', notification);
      io.to(`user_${studentId}`).emit('attendanceUpdate', attendance);
    }

    res.json({ success: true, attendance, message: 'Attendance marked successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this date' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark bulk attendance
// @route  POST /api/attendance/bulk
exports.markBulkAttendance = async (req, res) => {
  try {
    const { records, subject, date } = req.body;
    const faculty = req.user;
    const io = req.app.get('io');

    const attendanceDate = new Date(date || Date.now());
    attendanceDate.setHours(0, 0, 0, 0);

    const results = await Promise.allSettled(
      records.map(async ({ studentId, status, remarks }) => {
        const student = await User.findById(studentId);
        const attendance = await Attendance.findOneAndUpdate(
          { student: studentId, subject, date: attendanceDate },
          { student: studentId, faculty: faculty._id, subject, date: attendanceDate, status, remarks: remarks || '', department: student?.department, semester: student?.semester },
          { upsert: true, new: true }
        );

        const notification = await Notification.create({
          recipient: studentId,
          sender: faculty._id,
          type: 'attendance',
          title: 'Attendance Marked',
          message: `Your attendance for ${subject} on ${attendanceDate.toDateString()} has been marked as ${status}.`,
          link: '/attendance',
        });

        if (io) io.to(`user_${studentId}`).emit('notification', notification);
        return attendance;
      })
    );

    res.json({ success: true, results, message: 'Bulk attendance marked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get student attendance
// @route  GET /api/attendance/student/:studentId
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;

    const attendance = await Attendance.find({ student: studentId })
      .populate('faculty', 'name')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {};
    attendance.forEach((record) => {
      if (!summary[record.subject]) {
        summary[record.subject] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      summary[record.subject][record.status]++;
      summary[record.subject].total++;
    });

    // Add percentage
    Object.keys(summary).forEach((subject) => {
      const s = summary[subject];
      s.percentage = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;
    });

    res.json({ success: true, attendance, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get attendance analytics (Faculty)
// @route  GET /api/attendance/analytics
exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { subject, date } = req.query;
    const query = { faculty: req.user._id };
    if (subject) query.subject = subject;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = d;
    }

    const records = await Attendance.find(query).populate('student', 'name rollNumber');
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
    };

    res.json({ success: true, records, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get students list for faculty
// @route  GET /api/attendance/students
exports.getStudentsList = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('name rollNumber department semester email');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
