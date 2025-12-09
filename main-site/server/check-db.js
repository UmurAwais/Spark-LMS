const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority';

async function checkDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    const collections = ['orders', 'adminroles', 'activitylogs', 'studentbadges', 'onlinecourses', 'studentprogresses', 'certificates', 'courses', 'users', 'badges'];
    
    console.log('📊 Document Count per Collection:\n');
    
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      const padded = col.padEnd(20, ' ');
      console.log(`  ${padded} : ${count} documents`);
    }
    
    console.log('\n✅ Database check complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkDatabase();
