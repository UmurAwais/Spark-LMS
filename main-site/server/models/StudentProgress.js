const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  uid: { type: String, required: true }, // Using UID instead of email is better, but existing code uses email. Let's support both or migrate.
  email: { type: String, required: true },
  courseId: { type: String, required: true },
  completedLectures: [String], // Array of lecture IDs
  lastWatched: { type: Date, default: Date.now },
  progressPercentage: { type: Number, default: 0 }
});

// Compound index to ensure one record per user per course
studentProgressSchema.index({ email: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
