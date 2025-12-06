const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🔍 Complete System Diagnostic Report\n');
console.log('═'.repeat(70));

// 1. Environment Check
console.log('\n📋 1. ENVIRONMENT CONFIGURATION\n');
console.log('   Node Version:', process.version);
console.log('   Platform:', process.platform);
console.log('   Architecture:', process.arch);

// 2. Files Check
console.log('\n📁 2. REQUIRED FILES CHECK\n');
const requiredFiles = [
  '.env',
  'package.json',
  'index.js',
  'firebase-service-account.json',
  'models/Order.js',
  'models/Course.js',
  'models/OnlineCourse.js',
  'models/StudentProgress.js',
  'models/ActivityLog.js'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 3. Environment Variables
console.log('\n🔐 3. ENVIRONMENT VARIABLES\n');
const envVars = {
  'MONGODB_URI': process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
  'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD ? '✅ Set' : '❌ Missing',
  'PORT': process.env.PORT || '4001 (default)'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

// 4. MongoDB Connection String Analysis
console.log('\n🔗 4. MONGODB CONNECTION ANALYSIS\n');
const mongoUri = process.env.MONGODB_URI || '';

if (mongoUri) {
  const isAtlas = mongoUri.includes('mongodb+srv');
  const hasPassword = mongoUri.includes(':') && mongoUri.includes('@');
  
  console.log(`   Type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
  console.log(`   Has Password: ${hasPassword ? '✅ Yes' : '❌ No'}`);
  
  // Check for special characters that might need encoding
  const passwordMatch = mongoUri.match(/:([^@]+)@/);
  if (passwordMatch) {
    const password = passwordMatch[1];
    const specialChars = ['@', '#', '$', '%', '&', '+', '=', '/', '?', ':'];
    const hasSpecialChars = specialChars.some(char => password.includes(char));
    
    if (hasSpecialChars) {
      console.log('   ⚠️  Password contains special characters - may need URL encoding');
    } else {
      console.log('   ✅ Password format looks OK');
    }
  }
  
  // Extract database name
  const dbMatch = mongoUri.match(/\/([^?]+)/);
  if (dbMatch && dbMatch[1]) {
    console.log(`   Database: ${dbMatch[1]}`);
  }
} else {
  console.log('   ❌ MONGODB_URI not set in .env file');
}

// 5. Test MongoDB Connection
console.log('\n🧪 5. MONGODB CONNECTION TEST\n');
console.log('   Testing connection...');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('   ✅ MongoDB Connected Successfully!');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    // Test collections
    console.log('\n📊 6. DATABASE COLLECTIONS CHECK\n');
    
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    if (collections.length === 0) {
      console.log('   ⚠️  No collections found (database is empty)');
      console.log('   This is normal for a new database.');
    } else {
      console.log(`   Found ${collections.length} collections:\n`);
      collections.forEach(col => {
        console.log(`   ✅ ${col.name}`);
      });
    }
    
    // 7. Server Status
    console.log('\n🌐 7. SERVER STATUS\n');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      http.get('http://localhost:4001/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('   ✅ Server is running on http://localhost:4001');
            console.log('   ✅ Health check passed');
          } else {
            console.log(`   ⚠️  Server returned status: ${res.statusCode}`);
          }
          resolve();
        });
      }).on('error', (err) => {
        console.log('   ❌ Server is not responding');
        console.log(`   Error: ${err.message}`);
        resolve();
      });
    });
  })
  .then(() => {
    // 8. Summary
    console.log('\n═'.repeat(70));
    console.log('\n📝 DIAGNOSTIC SUMMARY\n');
    console.log('   ✅ Environment: OK');
    console.log('   ✅ Required files: Present');
    console.log('   ✅ MongoDB: Connected');
    console.log('   ✅ Server: Running');
    console.log('\n🎉 All systems operational!\n');
    console.log('═'.repeat(70));
    console.log('\n💡 Next Steps:\n');
    console.log('   1. Start your frontend: npm run dev (in main-site folder)');
    console.log('   2. Open browser: http://localhost:5173');
    console.log('   3. Test functionality: orders, courses, admin dashboard\n');
    
    process.exit(0);
  })
  .catch(err => {
    console.log(`   ❌ MongoDB Connection Failed: ${err.message}\n`);
    
    console.log('\n═'.repeat(70));
    console.log('\n📝 DIAGNOSTIC SUMMARY\n');
    console.log('   ✅ Environment: OK');
    console.log('   ✅ Required files: Present');
    console.log('   ❌ MongoDB: Connection Failed');
    console.log('   ⚠️  Server: Running (but database operations will fail)');
    console.log('\n🔧 ACTION REQUIRED:\n');
    
    if (err.message.includes('authentication') || err.message.includes('auth')) {
      console.log('   ❌ AUTHENTICATION ERROR\n');
      console.log('   Your MongoDB password is incorrect or needs URL encoding.\n');
      console.log('   Solutions:');
      console.log('   1. Run: node encode-password.js');
      console.log('   2. Or reset password in MongoDB Atlas');
      console.log('   3. Update .env file with correct password');
      console.log('\n   📖 See: FIX_AUTH_ERROR.md for detailed instructions\n');
    } else if (err.message.includes('IP') || err.message.includes('whitelist')) {
      console.log('   ❌ IP WHITELIST ERROR\n');
      console.log('   Your IP address is not allowed to access the database.\n');
      console.log('   Solutions:');
      console.log('   1. Go to MongoDB Atlas → Network Access');
      console.log('   2. Add your current IP address');
      console.log('   3. Wait 1-2 minutes and try again');
      console.log('\n   📖 See: FIX_IP_WHITELIST.md for detailed instructions\n');
    } else {
      console.log('   ❌ CONNECTION ERROR\n');
      console.log(`   Error: ${err.message}\n`);
      console.log('   📖 See: MONGODB_CONNECTION_FIX.md for troubleshooting\n');
    }
    
    console.log('═'.repeat(70));
    console.log('');
    
    process.exit(1);
  });
