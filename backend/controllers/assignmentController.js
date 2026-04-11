const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc   Upload assignment (Faculty)
// @route  POST /api/assignments
exports.uploadAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const { title, description, subject, department, semester, dueDate } = req.body;

    const assignment = await Assignment.create({
      title, description, subject, department,
      semester: parseInt(semester),
      dueDate: new Date(dueDate),
      faculty: req.user._id,
      fileUrl: req.file.path,
      filePublicId: req.file.filename,
      fileName: req.file.originalname,
    });

    await assignment.populate('faculty', 'name department');

    // Notify all students in the department/semester
    const students = await User.find({
      role: 'student',
      department,
      semester: parseInt(semester),
      isActive: true,
    }).select('_id');

    const io = req.app.get('io');
    const notifications = await Promise.all(
      students.map(async (student) => {
        const notif = await Notification.create({
          recipient: student._id,
          sender: req.user._id,
          type: 'assignment',
          title: 'New Assignment',
          message: `New assignment "${title}" uploaded for ${subject}. Due: ${new Date(dueDate).toDateString()}`,
          link: '/assignments',
          data: { assignmentId: assignment._id },
        });
        if (io) io.to(`user_${student._id}`).emit('notification', notif);
        return notif;
      })
    );

    res.status(201).json({ success: true, assignment, message: 'Assignment uploaded and students notified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get assignments (filtered by role)
// @route  GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.user.role === 'student') {
      query.department = req.user.department;
      query.semester = req.user.semester;
    } else if (req.user.role === 'faculty') {
      query.faculty = req.user._id;
    }

    const { subject, semester } = req.query;
    if (subject) query.subject = subject;
    if (semester) query.semester = parseInt(semester);

    const assignments = await Assignment.find(query)
      .populate('faculty', 'name department')
      .sort({ createdAt: -1 });

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single assignment
// @route  GET /api/assignments/:id
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('faculty', 'name department email');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Track download
// @route  POST /api/assignments/:id/download
exports.trackDownload = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, fileUrl: assignment.fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete assignment (Faculty)
// @route  DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user._id });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found or unauthorized' });

    await assignment.deleteOne();
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
