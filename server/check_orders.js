const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const count = await Order.countDocuments();
    console.log(`Total orders: ${count}`);
    
    if (count > 0) {
      const order = await Order.findOne();
      console.log('Sample order:', JSON.stringify(order, null, 2));
      console.log('CreatedAt type:', typeof order.createdAt);
      console.log('Amount type:', typeof order.amount);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkOrders();
