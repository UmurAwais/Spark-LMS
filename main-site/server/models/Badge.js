const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: String,
  description: String,
  milestoneType: { type: String, enum: ['percentage', 'course_completion'], required: true },
  milestoneValue: { type: Number, required: true },
  courseId: { type: String, default: 'all' }, // 'all' or specific course ID
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', badgeSchema);
