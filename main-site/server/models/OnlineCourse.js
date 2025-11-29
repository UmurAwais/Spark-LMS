const mongoose = require('mongoose');

const onlineCourseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  excerpt: String,
  price: String,
  image: String,
  videoUrl: String,
  rating: Number,
  ratingCount: String,
  duration: String,
  language: String,
  badge: mongoose.Schema.Types.Mixed,
  lectures: Array,
  whatYouWillLearn: [String],
  fullDescription: [String],
  requirements: [String],
  includes: [String],
  certificateTemplate: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OnlineCourse', onlineCourseSchema);
