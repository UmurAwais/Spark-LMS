const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  courseId: { type: String, required: true },
  courseTitle: String,
  regNo: { type: String, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  pdfUrl: String
});

module.exports = mongoose.model('Certificate', certificateSchema);
