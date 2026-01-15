// Migration script to import ALL actual courses into MongoDB
// Usage: node migrateAllCourses.js

const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const OnlineCourse = require('./models/OnlineCourse');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms';

// All ONSITE courses from initialCourses.js
const onsiteCourses = [
  {
    id: "web-development",
    image: "/src/assets/web development course.png",
    title: "Web Development with AI: Build 10 Projects Using GPT-4",
    excerpt: "Master WordPress, HTML, and CSS with hands-on, on-site training in Pakistan.",
    price: "Rs. 30,000",  
    badge: { label: "Premium", color: "bg-[#5022C3] text-white" },
    rating: 4.6,
    ratingCount: "11,320 ratings",
    duration: "2 Months",
    language: "Urdu / Hindi (On-site in Pakistan)",
  },
  {
    id: "graphic-design",
    image: "/src/assets/graphic design course.png",
    title: "Graphic Design Masterclass: Learn Graphic Design in 2026",
    excerpt: "Master graphic design with Adobe Photoshop and Illustrator in this on-site masterclass.",
    price: "Rs. 23,000",
    badge: { label: "Best One", color: "bg-[#0d9c06] text-white" },
    rating: 4.4,
    ratingCount: "1,220 ratings",
    duration: "2 Months",
    language: "Urdu / English (On-site in Pakistan)",
  },
  {
    id: "video-editing",
    image: "/src/assets/video editing course.png",
    title: "Video Editing Masterclass: Video Editing with AI Tools 2026",
    excerpt: "Learn advanced video editing using Adobe Premiere Pro, After Effects, and powerful AI tools.",
    price: "Rs. 30,000",
    badge: { label: "Hot & New", color: "bg-[#FFD1CE] text-[#b32d36]" },
    rating: 4.8,
    ratingCount: "80 ratings",
    duration: "2 Months",
    language: "Urdu / English (On-site in Pakistan)",
  },
  {
    id: "tiktok-shop",
    image: "/src/assets/tiktok course.png",
    title: "Tiktok Shop Mastery 2026: From Beginner to Pro Seller",
    excerpt: "Learn how to start, grow, and scale a profitable TikTok Shop in Pakistan.",
    price: "Rs. 25,000",
    badge: { label: "Hot & New", color: "bg-[#FFD1CE] text-[#b32d36]" },
    rating: 4.4,
    ratingCount: "4,849 ratings",
    duration: "2 Months",
    language: "Urdu / English (On-site in Pakistan)",
  },
  {
    id: "youtube-automation",
    image: "/src/assets/youtube automation course.png",
    title: "YouTube Automation with AI: Build a 6-Figure Channel 2026",
    excerpt: "Learn how to build and scale a faceless YouTube channel using AI tools and automation.",
    price: "Rs. 15,000",
    badge: { label: "Best One", color: "bg-[#0d9c06] text-white" },
    rating: 4.4,
    ratingCount: "4,849 ratings",
    duration: "2 Months",
    language: "Urdu / English (On-site in Pakistan)",
  },
  {
    id: "shopify-masterclass",
    image: "/src/assets/shopify masterclass course.png",
    title: "Shopify Masterclass 2026: Build & Scale Your Online Store",
    excerpt: "Learn Shopify store creation and eCommerce fundamentals in this 40-day masterclass.",
    price: "Rs. 25,000",
    badge: { label: "Premium", color: "bg-[#5022C3] text-white" },
    rating: 4.4,
    ratingCount: "4,849 ratings",
    duration: "40 Days",
    language: "Urdu / English (On-site in Pakistan)",
  },
  {
    id: "shopify-meta-ads",
    image: "/src/assets/shopify course.png",
    title: "Shopify + Meta Ads Mastery 2026: From Zero to Hero",
    excerpt: "Master Shopify store creation and Meta Ads strategy in this hands-on course.",
    price: "Rs. 35,000", 
    badge: { label: "Hot & New", color: "bg-[#FFD1CE] text-[#b32d36]" },
    rating: 4.4,
    ratingCount: "4,849 ratings",
    duration: "2 Months",
    language: "Urdu / Hindi (On-site in Pakistan)",
  },
  {
    id: "social-media-marketing",
    image: "/src/assets/social media marketing.png",
    title: "Social Media Marketing Mastery 2026: From Zero to Hero",
    excerpt: "Master social media marketing across Facebook, Instagram, and TikTok.",
    price: "Rs. 20,000",  
    badge: { label: "Premium", color: "bg-[#5022C3] text-white" },
    rating: 4.5,
    ratingCount: "2,540 ratings",
    duration: "40 Days",
    language: "Urdu / Hindi (On-site in Pakistan)",
  },
  {
    id: "english-speaking-mastery",
    image: "/src/assets/english speaking course.png",
    title: "English Speaking Mastery 2026: From Beginner to Fluent",
    excerpt: "Become a confident English speaker with this practical, on-site program.",
    price: "Rs. 15,000",
    badge: { label: "Best One", color: "bg-[#0d9c06] text-white" },
    rating: 4.5,
    ratingCount: "3,240 ratings",
    duration: "40 Days",
    language: "Urdu / English (On-site in Pakistan)",
  },
];

// All ONLINE courses from onlineCourses.js
const onlineCourses = [
  {
    id: "skin-care",
    image: "/src/assets/skin care course.png",
    title: "Skin Care Formulation: Complete Guide to Creating Skincare Products",
    excerpt: "Master the science of Skincare Formulation! This comprehensive online course teaches you the complete process of creating your own safe, stable, and effective cosmetics, from beginner basics to advanced anti-aging serums.",
    price: "Rs. 13,000",
    badge: { label: "Premium • Online", color: "bg-[#5022C3] text-white" },
    rating: 4.7,
    ratingCount: "1,420 ratings",
    language: "Urdu / Hindi (Online)",
    whatYouWillLearn: [
      "Build a complete skincare brand from concept to launch",
      "Use for formulation, testing, and packaging",
      "Understand regulations, safety, and long-term brand scaling",
    ],
    includes: [
      "Lifetime access to all recorded video lectures (HD Quality)",
      "Downloadable professional formula templates and batch records",
      "Curated list of trusted Asian-region ingredient suppliers",
      "Hands-on practical assignments and stability testing guides",
      "Official Certificate of Completion (Digital)"
    ],
    fullDescription: [
      "This comprehensive online course is the ultimate guide to cosmetic formulation, designed for aspiring entrepreneurs and enthusiasts across Asia. You will move past simple DIY recipes and master the professional principles of cosmetic chemistry, allowing you to create customized, market-ready skincare products. The curriculum includes detailed modules on ingredient functionality, preservation systems, stability testing, and the specific needs of diverse Asian skin types, ensuring your formulations are not only effective but also safe and professional.",
      "The course emphasizes practical application, providing step-by-step guidance on creating everything from hydrating toners and anti-aging serums to stable face creams, all while adhering to industry-standard safety and quality controls (GMP).",
    ],
  },
  {
    id: "english-online",
    image: "/src/assets/english speaking course.png",
    title: "English Speaking (Online): From Shy to Confident in few days",
    excerpt: "Join online English speaking classes focused on real conversations, confidence-building and practical communication for Pakistani students and professionals.",
    price: "Rs. 5,000",
    badge: {
      label: "Online • Live Speaking Practice",
      color: "bg-[#FFD1CE] text-[#b32d36]",
    },
    rating: 4.5,
    ratingCount: "2,050 ratings",
    language: "Urdu / English (Online)",
    whatYouWillLearn: [
      "Speak English more confidently in everyday situations",
      "Improve grammar, sentence structure and vocabulary in a natural way",
      "Practice real conversations for interviews, meetings and presentations",
      "Remove fear of speaking English through guided live practice",
    ],
    includes: [
      "Online live speaking sessions",
      "Practice groups and role-plays",
      "Worksheets and vocabulary lists",
      "Certificate of completion from Spark Trainings",
    ],
    fullDescription: [
      "English Speaking (Online) is a live, highly practical course designed for Pakistani learners who understand English but hesitate to speak.",
      "The focus is not on complicated grammar theory, but on real speaking practice through conversations, role-plays and daily life scenarios.",
      "You will speak in almost every class, get corrections, build confidence and develop a natural flow while talking in English in front of others.",
    ],
  },  
  {
    id: "ppsc",
    image: "/src/assets/shopify masterclass course.png",
    title: "PPSC Preparation: The Complete Competitive Exam Preparation Course",
    excerpt: "Master the art of competitive exam preparation with our comprehensive online course designed for Pakistani students and professionals.",
    price: "Rs. 4,000",
    badge: {
      label: "Online • Beginner Friendly",
      color: "bg-[#5022C3] text-white",
    },
    rating: 4.6,
    ratingCount: "980 ratings",
    language: "Urdu / Hindi (Online)",
    whatYouWillLearn: [
      "Master the art of competitive exam preparation",
      "Understand the structure and format of competitive exams",
      "Learn effective study strategies and time management techniques",
      "Develop a strong foundation in core subjects",
      "Improve your English language skills for competitive exams",
    ],
    includes: [
      "Online live sessions with instructor",
      "Practice tests and mock exams",
      "Study materials and resources",
      "Certificate of completion from Spark Trainings",
    ],
    fullDescription: [
      "Welcome to the ultimate PPSC Preparation Masterclass, designed to give you the competitive edge needed to secure a high-ranking position in the Punjab government services.",
      "This is not just a syllabus overview; it's a strategic study program. Our course is meticulously structured to cover the entire PPSC curriculum, focusing on both the objective (MCQs) and subjective (Descriptive) parts of the examination.",
      "All classes are conducted online so you can join from any city. You'll also receive assignments to implement each step directly in your own store as you learn.",
      "What makes this course stand out?",
      "-> Targeted Content: Deep dives into Pakistan Affairs and Current Affairs (National and Global), which are critical scoring areas.",
      "-> Skill Development: Dedicated modules for improving your English Essay and Precis Writing—often the papers that determine selection.",
      "-> Comprehensive Coverage: In-depth study of all core subjects, including Pakistan Studies, Islamiat, Urdu, and English.",
      "-> Interview Focus: Practical guidance and mock sessions to prepare you for the final hurdle: the PPSC Interview.",
    ],
  },
];

async function migrateAllCourses() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Clear existing courses first
    console.log('🗑️  Clearing existing courses...');
    await Course.deleteMany({});
    await OnlineCourse.deleteMany({});
    console.log('✅ Database cleared');
    console.log('');

    // Migrate onsite courses
    console.log('📦 Migrating 9 onsite courses...');
    let onsiteCount = 0;
    for (const course of onsiteCourses) {
      try {
        await Course.create(course);
        console.log(`  ✅ Added: ${course.title}`);
        onsiteCount++;
      } catch (error) {
        console.log(`  ❌ Error adding ${course.title}:`, error.message);
      }
    }
    console.log(`\n✅ Migrated ${onsiteCount}/9 onsite courses`);
    console.log('');

    // Migrate online courses
    console.log('📦 Migrating 3 online courses...');
    let onlineCount = 0;
    for (const course of onlineCourses) {
      try {
        await OnlineCourse.create(course);
        console.log(`  ✅ Added: ${course.title}`);
        onlineCount++;
      } catch (error) {
        console.log(`  ❌ Error adding ${course.title}:`, error.message);
      }
    }
    console.log(`\n✅ Migrated ${onlineCount}/3 online courses`);
    console.log('');

    console.log('🎉 Migration complete!');
    console.log('');
    console.log('Summary:');
    console.log(`  - Onsite courses: ${onsiteCount}/9 added`);
    console.log(`  - Online courses: ${onlineCount}/3 added`);
    console.log(`  - Total: ${onsiteCount + onlineCount}/12 courses`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Refresh your admin dashboard (Ctrl+Shift+F5)');
    console.log('  2. All 12 courses should now appear');
    console.log('  3. You can now delete courses properly');
    console.log('  4. Deleted courses will disappear from both admin and main site');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateAllCourses();
