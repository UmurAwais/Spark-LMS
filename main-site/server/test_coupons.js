const mongoose = require('mongoose');
require('dotenv').config();
const Coupon = require('./models/Coupon');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms');
    console.log('Connected to MongoDB');
    
    const count = await Coupon.countDocuments();
    console.log('Coupon count:', count);
    
    const coupons = await Coupon.find();
    console.log('Coupons:', coupons);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();
