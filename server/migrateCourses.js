// Migration script to import all static courses into MongoDB
// Usage: node migrateCourses.js

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms';

// Static course data - copied from the data files
const initialCourses = [
  {
    id: "web-development",
    title: "Complete Web Development Bootcamp",
    excerpt: "Master HTML, CSS, JavaScript, React, Node.js and more in this comprehensive bootcamp",
    price: "PKR 25,000",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500",
    rating: 4.8,
    ratingCount: "2,340 ratings",
    duration: "3 Months",
    language: "Urdu / English",
    badge: { label: "Best Seller", color: "bg-[#0d9c06] text-white" }
  }
];

const onlineCourses = [
  {
    id: "shopify",
    title: "Shopify Dropshipping Masterclass",
    excerpt: "Learn how to build and scale a profitable Shopify dropshipping store from scratch",
    price: "PKR 15,000",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500",
    rating: 4.7,
    ratingCount: "1,890 ratings",
    duration: "2 Months",
    language: "Urdu / Hindi (Online)",
    badge: { label: "Premium • Online", color: "bg-[#5022C3] text-white" },
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    whatYouWillLearn: [
      "Set up and customize your Shopify store",
      "Find winning products using proven research methods",
      "Create high-converting product pages",
      "Run profitable Facebook and Instagram ads",
      "Automate your dropshipping business"
    ],
    includes: [
      "Lifetime access to course materials",
      "Live Q&A sessions every week",
      "Private community access",
      "Certificate of completion"
    ],
    fullDescription: [
      "Master the art of Shopify dropshipping with our comprehensive online course designed for Pakistani students and professionals.",
      "Learn everything from store setup to scaling your business to 6 figures."
    ]
  }
];

async function migrateCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Migrate onsite courses
    console.log('📦 Migrating onsite courses...');
    let onsiteCount = 0;
    for (const course of initialCourses) {
      try {
        const existing = await Course.findOne({ id: course.id });
        if (!existing) {
          await Course.create(course);
          console.log(`  ✅ Added: ${course.title}`);
          onsiteCount++;
        } else {
          console.log(`  ⏭️  Skipped (already exists): ${course.title}`);
        }
      } catch (error) {
        console.log(`  ❌ Error adding ${course.title}:`, error.message);
      }
    }
    console.log(`\n✅ Migrated ${onsiteCount} onsite courses`);
    console.log('');

    // Migrate online courses
    console.log('📦 Migrating online courses...');
    let onlineCount = 0;
    for (const course of onlineCourses) {
      try {
        const existing = await OnlineCourse.findOne({ id: course.id });
        if (!existing) {
          await OnlineCourse.create(course);
          console.log(`  ✅ Added: ${course.title}`);
          onlineCount++;
        } else {
          console.log(`  ⏭️  Skipped (already exists): ${course.title}`);
        }
      } catch (error) {
        console.log(`  ❌ Error adding ${course.title}:`, error.message);
      }
    }
    console.log(`\n✅ Migrated ${onlineCount} online courses`);
    console.log('');

    console.log('🎉 Migration complete!');
    console.log('');
    console.log('Summary:');
    console.log(`  - Onsite courses: ${onsiteCount} added`);
    console.log(`  - Online courses: ${onlineCount} added`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Refresh your admin dashboard');
    console.log('  2. All courses should now appear');
    console.log('  3. You can now delete courses properly');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateCourses();
