const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-lms';

console.log('🔍 MongoDB Connection Diagnostic Tool\n');
console.log('━'.repeat(60));

// Mask password in URI for display
function maskUri(uri) {
  return uri.replace(/:([^:@]+)@/, ':****@');
}

console.log('📊 Connection Details:');
console.log(`   URI: ${maskUri(MONGODB_URI)}`);
console.log(`   Type: ${MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
console.log('━'.repeat(60));

console.log('\n⏳ Attempting to connect...\n');

const startTime = Date.now();

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000,
})
  .then(() => {
    const duration = Date.now() - startTime;
    console.log('✅ SUCCESS! Connected to MongoDB');
    console.log(`   Connection time: ${duration}ms`);
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log('━'.repeat(60));
    
    // Test database operations
    console.log('\n🧪 Testing database operations...\n');
    
    return mongoose.connection.db.admin().listDatabases();
  })
  .then((result) => {
    console.log('✅ Database operations working!');
    console.log(`   Available databases: ${result.databases.length}`);
    console.log('━'.repeat(60));
    
    console.log('\n✨ All tests passed! Your MongoDB connection is working perfectly.\n');
    console.log('You can now run your server with: npm run dev\n');
    
    process.exit(0);
  })
  .catch(err => {
    const duration = Date.now() - startTime;
    console.log('❌ CONNECTION FAILED');
    console.log(`   Time elapsed: ${duration}ms`);
    console.log('━'.repeat(60));
    
    console.log('\n🔍 Error Details:');
    console.log(`   Type: ${err.name}`);
    console.log(`   Message: ${err.message}`);
    console.log('━'.repeat(60));
    
    console.log('\n💡 Troubleshooting Tips:\n');
    
    if (err.message.includes('IP') || err.message.includes('whitelist')) {
      console.log('   ⚠️  IP WHITELIST ISSUE (MongoDB Atlas)');
      console.log('   → Your IP address is not allowed to access the database');
      console.log('   → Solution:');
      console.log('      1. Go to MongoDB Atlas → Network Access');
      console.log('      2. Click "Add IP Address"');
      console.log('      3. Click "Add Current IP Address"');
      console.log('      4. Wait 1-2 minutes and try again');
      console.log('');
      console.log('   📖 Full guide: See MONGODB_CONNECTION_FIX.md');
    } 
    else if (err.message.includes('authentication') || err.message.includes('auth')) {
      console.log('   ⚠️  AUTHENTICATION ISSUE');
      console.log('   → Your username or password is incorrect');
      console.log('   → Solution:');
      console.log('      1. Check your .env file');
      console.log('      2. Verify MONGODB_URI has correct username and password');
      console.log('      3. Make sure password is URL-encoded (no special chars)');
      console.log('      4. Or reset password in MongoDB Atlas → Database Access');
    }
    else if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
      console.log('   ⚠️  CONNECTION REFUSED (Local MongoDB)');
      console.log('   → MongoDB is not running on your computer');
      console.log('   → Solution:');
      console.log('      1. Check if MongoDB is installed: mongod --version');
      console.log('      2. Start MongoDB service: net start MongoDB');
      console.log('      3. Or install MongoDB from: https://www.mongodb.com/try/download/community');
      console.log('');
      console.log('   Alternative: Use MongoDB Atlas (cloud) instead');
      console.log('   📖 Full guide: See MONGODB_CONNECTION_FIX.md');
    }
    else if (err.message.includes('timeout') || err.message.includes('timed out')) {
      console.log('   ⚠️  CONNECTION TIMEOUT');
      console.log('   → Cannot reach MongoDB server');
      console.log('   → Possible causes:');
      console.log('      • Firewall blocking connection');
      console.log('      • Network issue');
      console.log('      • Wrong connection string');
      console.log('   → Solution:');
      console.log('      1. Check your internet connection');
      console.log('      2. Verify MONGODB_URI in .env file');
      console.log('      3. Check firewall settings');
    }
    else {
      console.log('   ⚠️  UNKNOWN ERROR');
      console.log('   → Check the error message above');
      console.log('   → Verify your .env file configuration');
      console.log('   → See MONGODB_CONNECTION_FIX.md for detailed help');
    }
    
    console.log('\n━'.repeat(60));
    console.log('\n📧 Need more help? Check MONGODB_CONNECTION_FIX.md\n');
    
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  process.exit(0);
});
