const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc   Create notice (Faculty/Admin)
// @route  POST /api/notices
exports.createNotice = async (req, res) => {
  try {
    const { title, content, category, targetAudience, department, semester, isPinned } = req.body;

    const notice = await Notice.create({
      title, content, category: category || 'general',
      targetAudience: targetAudience || 'all',
      department: department || 'all',
      semester: semester ? parseInt(semester) : undefined,
      isPinned: isPinned || false,
      author: req.user._id,
      attachmentUrl: req.file?.path,
    });

    await notice.populate('author', 'name role department');

    // Notify relevant users
    let userQuery = { isActive: true };
    if (targetAudience === 'students') userQuery.role = 'student';
    else if (targetAudience === 'faculty') userQuery.role = 'faculty';
    if (department && department !== 'all') userQuery.department = department;
    if (semester) userQuery.semester = parseInt(semester);

    const users = await User.find(userQuery).select('_id');
    const io = req.app.get('io');

    await Promise.all(
      users.map(async (user) => {
        if (user._id.toString() === req.user._id.toString()) return;
        const notif = await Notification.create({
          recipient: user._id,
          sender: req.user._id,
          type: 'notice',
          title: `📢 ${category?.toUpperCase() || 'NOTICE'}: ${title}`,
          message: content.substring(0, 120) + (content.length > 120 ? '...' : ''),
          link: '/notices',
          data: { noticeId: notice._id },
        });
        if (io) io.to(`user_${user._id}`).emit('notification', notif);
      })
    );

    // Broadcast new notice to all connected clients
    if (io) io.emit('newNotice', notice);

    res.status(201).json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all notices
// @route  GET /api/notices
exports.getNotices = async (req, res) => {
  try {
    let query = { isActive: true };
    const { category, search } = req.query;

    if (req.user.role === 'student') {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: 'students' },
      ];
      query.$and = [
        { $or: [{ department: 'all' }, { department: req.user.department }] },
        { $or: [{ semester: { $exists: false } }, { semester: req.user.semester }] },
      ];
    }

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const notices = await Notice.find(query)
      .populate('author', 'name role department')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single notice & increment views
// @route  GET /api/notices/:id
exports.getNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name role department');

    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update notice
// @route  PUT /api/notices/:id
exports.updateNotice = async (req, res) => {
  try {
    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      req.body,
      { new: true }
    ).populate('author', 'name role');

    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found or unauthorized' });
    res.json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete notice
// @route  DELETE /api/notices/:id
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found or unauthorized' });
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
