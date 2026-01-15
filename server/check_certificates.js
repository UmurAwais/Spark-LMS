const mongoose = require('mongoose');
require('dotenv').config();
const OnlineCourse = require('./models/OnlineCourse');

async function checkCertificates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const courses = await OnlineCourse.find({}, 'id certificateTemplate');
    console.log(JSON.stringify(courses, null, 2));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkCertificates();
