// Script to update course image paths from PNG to JPG in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');

const imageMapping = {
  '/uploads/courses/english-speaking-course.png': '/uploads/courses/english-speaking-course.jpg',
  '/uploads/courses/graphic-design-course.png': '/uploads/courses/graphic-design-course.jpg',
  '/uploads/courses/shopify-course.png': '/uploads/courses/shopify-course.jpg',
  '/uploads/courses/shopify-masterclass-course.png': '/uploads/courses/shopify-masterclass-course.jpg',
  '/uploads/courses/skin-care-course.png': '/uploads/courses/skin-care-course.jpg',
  '/uploads/courses/tiktok-course.png': '/uploads/courses/tiktok-course.jpg',
  '/uploads/courses/video-editing-course.png': '/uploads/courses/video-editing-course.jpg',
  '/uploads/courses/web-development-course.png': '/uploads/courses/web-development-course.jpg',
  '/uploads/courses/youtube-automation-course.png': '/uploads/courses/youtube-automation-course.jpg',
  '/uploads/courses/social-media-marketing.png': '/uploads/courses/social-media-marketing.jpg'
};

async function updateImageExtensions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix onsite courses
    const onsiteCourses = await Course.find({});
    console.log(`Found ${onsiteCourses.length} onsite courses`);
    
    for (const course of onsiteCourses) {
      if (imageMapping[course.image]) {
        course.image = imageMapping[course.image];
        await course.save();
        console.log(`✅ Updated ${course.title} to JPG`);
      }
    }

    // Fix online courses
    const onlineCourses = await OnlineCourse.find({});
    console.log(`Found ${onlineCourses.length} online courses`);
    
    for (const course of onlineCourses) {
      if (imageMapping[course.image]) {
        course.image = imageMapping[course.image];
        await course.save();
        console.log(`✅ Updated ${course.title} to JPG`);
      }
    }

    console.log('✅ All course images updated to JPG!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateImageExtensions();
