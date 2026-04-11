const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['general', 'exam', 'event', 'holiday', 'urgent', 'placement'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'faculty'],
    default: 'all'
  },
  department: { type: String, default: 'all' },
  semester: { type: Number }, // null = all semesters
  isActive: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  attachmentUrl: { type: String },
  views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
