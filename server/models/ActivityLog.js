const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Keeping string ID for compatibility
  type: { type: String, default: 'info' },
  title: String,
  message: String,
  user: String,
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
