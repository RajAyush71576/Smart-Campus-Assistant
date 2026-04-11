const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['assignment', 'notice', 'attendance', 'announcement', 'system'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // frontend route to navigate to
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }, // extra payload
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
