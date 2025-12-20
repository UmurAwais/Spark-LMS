const mongoose = require('mongoose');
require('dotenv').config();
const Coupon = require('./models/Coupon');

async function createTestCoupon() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms');
    console.log('✅ Connected to MongoDB');
    
    // Check if SPARK50 already exists
    const existing = await Coupon.findOne({ code: 'SPARK50' });
    if (existing) {
      console.log('✅ SPARK50 coupon already exists:', existing);
    } else {
      // Create SPARK50 coupon
      const coupon = await Coupon.create({
        code: 'SPARK50',
        type: 'percent',
        value: 50,
        label: '50% Discount',
        isActive: true
      });
      console.log('✅ Created SPARK50 coupon:', coupon);
    }
    
    // List all coupons
    const allCoupons = await Coupon.find();
    console.log(`\n📋 Total coupons in database: ${allCoupons.length}`);
    allCoupons.forEach(c => {
      console.log(`  - ${c.code}: ${c.value}${c.type === 'percent' ? '%' : ' PKR'} (${c.isActive ? 'Active' : 'Inactive'})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createTestCoupon();
