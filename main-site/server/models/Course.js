const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  excerpt: String,
  price: String,
  image: String,
  rating: Number,
  ratingCount: String,
  duration: String,
  language: String,
  badge: mongoose.Schema.Types.Mixed,
  instructor: String,
  lectures: Array,
  whatYouWillLearn: [String],
  includes: [String],
  fullDescription: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
