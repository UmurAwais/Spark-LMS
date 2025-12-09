// Script to fix course image paths in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');

const imageMapping = {
  '/src/assets/english speaking course.png': '/uploads/courses/english-speaking-course.png',
  '/src/assets/graphic design course.png': '/uploads/courses/graphic-design-course.png',
  '/src/assets/shopify course.png': '/uploads/courses/shopify-course.png',
  '/src/assets/shopify masterclass course.png': '/uploads/courses/shopify-masterclass-course.png',
  '/src/assets/skin care course.png': '/uploads/courses/skin-care-course.png',
  '/src/assets/tiktok course.png': '/uploads/courses/tiktok-course.png',
  '/src/assets/video editing course.png': '/uploads/courses/video-editing-course.png',
  '/src/assets/web development course.png': '/uploads/courses/web-development-course.png',
  '/src/assets/youtube automation course.png': '/uploads/courses/youtube-automation-course.png',
  '/src/assets/social media marketing.png': '/uploads/courses/social-media-marketing.png'
};

async function fixImagePaths() {
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
        console.log(`✅ Updated ${course.title}`);
      }
    }

    // Fix online courses
    const onlineCourses = await OnlineCourse.find({});
    console.log(`Found ${onlineCourses.length} online courses`);
    
    for (const course of onlineCourses) {
      if (imageMapping[course.image]) {
        course.image = imageMapping[course.image];
        await course.save();
        console.log(`✅ Updated ${course.title}`);
      }
    }

    console.log('✅ All course images updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixImagePaths();
