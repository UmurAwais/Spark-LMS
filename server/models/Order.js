const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  uid: String,
  firstName: String,
  lastName: String,
  city: String,
  phone: String,
  email: String,
  notes: String,
  courseId: String,
  courseTitle: String,
  items: Array,
  amount: String,
  paymentScreenshot: String,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
