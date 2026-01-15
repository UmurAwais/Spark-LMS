// Migration script to update course image paths in MongoDB
// This fixes the image paths to use public folder URLs with URL-encoded spaces
// Usage: node updateCourseImages.js

const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms';

// Correct image paths for online courses
const onlineCoursesImageMap = {
  "skin-care": "/courses/skin%20care%20course.jpg",
  "english-online": "/courses/english%20speaking%20course.jpg",
  "ppsc": "/courses/ppsc%20course.jpg"
};

// Correct image paths for onsite courses
const onsiteCoursesImageMap = {
  "web-development": "/courses/web%20development%20course.jpg",
  "graphic-design": "/courses/graphic%20design%20course.jpg",
  "video-editing": "/courses/video%20editing%20course.jpg",
  "tiktok-shop": "/courses/tiktok%20course.jpg",
  "youtube-automation": "/courses/youtube%20automation%20course.jpg",
  "shopify-masterclass": "/courses/shopify%20masterclass%20course.jpg",
  "shopify-meta-ads": "/courses/shopify%20course.jpg",
  "social-media-marketing": "/courses/social%20media%20marketing.jpg",
  "english-speaking-mastery": "/courses/english%20speaking%20course.jpg"
};

async function updateCourseImages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Update online courses
    console.log('📝 Updating online course images...');
    let onlineUpdated = 0;
    for (const [courseId, imagePath] of Object.entries(onlineCoursesImageMap)) {
      try {
        const result = await OnlineCourse.updateOne(
          { id: courseId },
          { $set: { image: imagePath } }
        );
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Updated: ${courseId} → ${imagePath}`);
          onlineUpdated++;
        } else {
          console.log(`  ⏭️  No change needed: ${courseId}`);
        }
      } catch (error) {
        console.log(`  ❌ Error updating ${courseId}:`, error.message);
      }
    }
    console.log(`\n✅ Updated ${onlineUpdated} online courses`);
    console.log('');

    // Update onsite courses
    console.log('📝 Updating onsite course images...');
    let onsiteUpdated = 0;
    for (const [courseId, imagePath] of Object.entries(onsiteCoursesImageMap)) {
      try {
        const result = await Course.updateOne(
          { id: courseId },
          { $set: { image: imagePath } }
        );
        if (result.modifiedCount > 0) {
          console.log(`  ✅ Updated: ${courseId} → ${imagePath}`);
          onsiteUpdated++;
        } else {
          console.log(`  ⏭️  No change needed: ${courseId}`);
        }
      } catch (error) {
        console.log(`  ❌ Error updating ${courseId}:`, error.message);
      }
    }
    console.log(`\n✅ Updated ${onsiteUpdated} onsite courses`);
    console.log('');

    console.log('🎉 Image update complete!');
    console.log('');
    console.log('Summary:');
    console.log(`  - Online courses updated: ${onlineUpdated}`);
    console.log(`  - Onsite courses updated: ${onsiteUpdated}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Clear browser cache or hard refresh');
    console.log('  2. All course images should now display correctly');
    console.log('  3. Images will persist after page refresh');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Update error:', error);
    process.exit(1);
  }
}

updateCourseImages();
