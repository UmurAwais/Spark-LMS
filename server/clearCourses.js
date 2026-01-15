// Run this script to clear all courses from MongoDB and start fresh
// Usage: node clearCourses.js

const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms';

async function clearAllCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all onsite courses
    const onsiteResult = await Course.deleteMany({});
    console.log(`🗑️  Deleted ${onsiteResult.deletedCount} onsite courses`);

    // Delete all online courses
    const onlineResult = await OnlineCourse.deleteMany({});
    console.log(`🗑️  Deleted ${onlineResult.deletedCount} online courses`);

    console.log('✅ All courses cleared from database');
    console.log('');
    console.log('Now you can:');
    console.log('1. Refresh your admin dashboard');
    console.log('2. Add new courses through the admin panel');
    console.log('3. Those courses can be properly deleted');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAllCourses();
