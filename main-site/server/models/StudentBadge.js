const mongoose = require('mongoose');

const studentBadgeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  badgeId: { type: String, required: true },
  courseId: String,
  awardedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentBadge', studentBadgeSchema);
