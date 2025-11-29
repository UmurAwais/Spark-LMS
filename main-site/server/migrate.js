const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');
const Order = require('./models/Order');

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // Migrate Onsite Courses
    const coursesFile = path.join(__dirname, 'courses.json');
    if (fs.existsSync(coursesFile)) {
      const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
      if (courses.length > 0) {
        console.log(`📦 Migrating ${courses.length} onsite courses...`);
        for (const course of courses) {
          // Ensure unique ID
          await Course.findOneAndUpdate({ id: course.id }, course, { upsert: true, new: true });
        }
        console.log('✅ Onsite courses migrated');
      }
    }

    // Migrate Online Courses
    const onlineCoursesFile = path.join(__dirname, 'onlineCourses.json');
    if (fs.existsSync(onlineCoursesFile)) {
      const courses = JSON.parse(fs.readFileSync(onlineCoursesFile, 'utf8'));
      if (courses.length > 0) {
        console.log(`📦 Migrating ${courses.length} online courses...`);
        for (const course of courses) {
          await OnlineCourse.findOneAndUpdate({ id: course.id }, course, { upsert: true, new: true });
        }
        console.log('✅ Online courses migrated');
      }
    }

    // Migrate Orders
    const ordersFile = path.join(__dirname, 'orders.json');
    if (fs.existsSync(ordersFile)) {
      const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
      if (orders.length > 0) {
        console.log(`📦 Migrating ${orders.length} orders...`);
        for (const order of orders) {
          // Orders might not have a unique string ID in the old system (it was Date.now()), 
          // but we can try to match by ID or just insert.
          // Since Mongoose generates _id, we'll check if an order with this 'id' (from JSON) exists.
          // We need to make sure our Schema supports the 'id' field if we want to keep it, 
          // or just map it. The current Order schema doesn't have an explicit 'id' field, it uses _id.
          // Let's add the old 'id' to the schema or just rely on _id.
          // The schema I created earlier:
          /*
            const orderSchema = new mongoose.Schema({
              uid: String,
              ...
              createdAt: { type: Date, default: Date.now }
            });
          */
          // It doesn't have a custom 'id' field. I should probably add it or just import as new documents.
          // For simplicity, I will just insert them. To avoid duplicates on re-runs, I'll check by paymentScreenshot or timestamp?
          // Let's check if we can find one with the same email and createdAt.
          
          const exists = await Order.findOne({ 
            email: order.email, 
            createdAt: order.createdAt 
          });
          
          if (!exists) {
            await Order.create(order);
          }
        }
        console.log('✅ Orders migrated');
      }
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
