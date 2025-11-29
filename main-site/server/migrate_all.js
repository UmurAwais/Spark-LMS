const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const StudentProgress = require('./models/StudentProgress');
const Badge = require('./models/Badge');
const ActivityLog = require('./models/ActivityLog');

async function migrateAll() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // 1. Migrate Student Progress
    try {
      const progressFile = path.join(__dirname, 'student_progress.json');
      if (fs.existsSync(progressFile)) {
        const data = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
        console.log('📦 Migrating student progress...');
        
        for (const [email, courses] of Object.entries(data)) {
          for (const [courseId, lectures] of Object.entries(courses)) {
            const completedLectures = Object.keys(lectures).filter(k => lectures[k] === true);
            
            await StudentProgress.findOneAndUpdate(
              { email, courseId },
              {
                email,
                courseId,
                uid: email, // Use email as fallback UID
                completedLectures,
                lastWatched: new Date(),
                progressPercentage: 0 // Will be recalculated on next update or we could calc it now but need course data
              },
              { upsert: true, new: true }
            );
          }
        }
        console.log('✅ Student progress migrated');
      }
    } catch (err) {
      console.error('❌ Failed to migrate student progress:', err.message);
    }

    // 2. Migrate Badges
    try {
      const badgesFile = path.join(__dirname, 'badges.json');
      if (fs.existsSync(badgesFile)) {
        let content = fs.readFileSync(badgesFile, 'utf8');
        // Strip BOM if present
        content = content.replace(/^\uFEFF/, '');
        
        try {
          JSON.parse(content);
        } catch (e) {
             // If utf8 fails, try utf16le
             console.log('⚠️ UTF-8 parse failed, trying UTF-16LE...');
             content = fs.readFileSync(badgesFile, 'utf16le');
             content = content.replace(/^\uFEFF/, '');
        }

        const badges = JSON.parse(content);
        if (badges.length > 0) {
          console.log(`📦 Migrating ${badges.length} badges...`);
          for (const badge of badges) {
            await Badge.findOneAndUpdate({ id: badge.id }, badge, { upsert: true, new: true });
          }
          console.log('✅ Badges migrated');
        }
      }
    } catch (err) {
      console.error('❌ Failed to migrate badges:', err.message);
    }

    // 3. Migrate Activity Logs
    try {
      const logsFile = path.join(__dirname, 'activity_logs.json');
      if (fs.existsSync(logsFile)) {
        const logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
        if (logs.length > 0) {
          console.log(`📦 Migrating ${logs.length} activity logs...`);
          for (const log of logs) {
            // Ensure ID is string
            const logData = { ...log, id: String(log.id) };
            await ActivityLog.findOneAndUpdate({ id: logData.id }, logData, { upsert: true, new: true });
          }
          console.log('✅ Activity logs migrated');
        }
      }
    } catch (err) {
      console.error('❌ Failed to migrate activity logs:', err.message);
    }

    console.log('🎉 Full migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAll();
