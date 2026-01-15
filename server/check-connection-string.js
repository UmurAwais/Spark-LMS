require('dotenv').config();

console.log('\n🔍 Connection String Analyzer\n');
console.log('═'.repeat(70));

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log('❌ MONGODB_URI is not set in .env file!\n');
  process.exit(1);
}

console.log('\n📊 Current Connection String Analysis:\n');

// Parse the connection string
try {
  // Extract components
  const protocol = uri.match(/^(mongodb(\+srv)?):\/\//);
  const credentials = uri.match(/:\/\/([^:]+):([^@]+)@/);
  const cluster = uri.match(/@([^\/]+)/);
  const database = uri.match(/\/([^?]+)/);
  const options = uri.match(/\?(.+)$/);

  console.log('Protocol:', protocol ? protocol[1] : '❌ Missing');
  console.log('Username:', credentials ? credentials[1] : '❌ Missing');
  console.log('Password:', credentials ? '****' + credentials[2].slice(-4) : '❌ Missing');
  console.log('Cluster:', cluster ? cluster[1] : '❌ Missing');
  console.log('Database:', database ? database[1] : '❌ Missing or wrong format');
  console.log('Options:', options ? options[1] : '⚠️  Missing (recommended)');

  console.log('\n═'.repeat(70));
  console.log('\n🔍 Issues Found:\n');

  let hasIssues = false;

  // Check for common issues
  if (!protocol || protocol[1] !== 'mongodb+srv') {
    console.log('❌ Protocol should be "mongodb+srv" for Atlas');
    hasIssues = true;
  }

  if (!credentials) {
    console.log('❌ Missing username or password');
    hasIssues = true;
  } else {
    const username = credentials[1];
    const password = credentials[2];

    if (username !== 'theprogrammerco_db_user') {
      console.log(`⚠️  Username is "${username}" - expected "theprogrammerco_db_user"`);
    }

    // Check if password might have unencoded special chars
    const specialChars = ['@', '#', '$', '%', '&', '+', '=', '/', '?', ':', ' '];
    const hasSpecialChars = specialChars.some(char => password.includes(char));
    
    if (hasSpecialChars) {
      console.log('⚠️  Password contains special characters that may need URL encoding');
      console.log('   Run: node encode-password.js');
      hasIssues = true;
    }
  }

  if (!database || database[1].includes(':') || database[1].includes('@')) {
    console.log('❌ Database name is malformed or missing');
    console.log('   Should be: spark-lms');
    hasIssues = true;
  }

  if (!options || !options[1].includes('retryWrites')) {
    console.log('⚠️  Missing recommended options: ?retryWrites=true&w=majority');
  }

  if (!hasIssues) {
    console.log('✅ Connection string format looks correct');
    console.log('\n💡 If authentication is still failing:');
    console.log('   1. The password is incorrect');
    console.log('   2. Reset password in MongoDB Atlas');
    console.log('   3. Update .env file with new password');
  }

  console.log('\n═'.repeat(70));
  console.log('\n📝 Correct Format Should Be:\n');
  console.log('MONGODB_URI=mongodb+srv://theprogrammerco_db_user:YOUR_PASSWORD@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority');
  console.log('\n═'.repeat(70));
  console.log('\n🔧 Next Steps:\n');
  console.log('1. Go to MongoDB Atlas: https://cloud.mongodb.com/');
  console.log('2. Database Access → Edit user → Reset Password');
  console.log('3. Copy the new password');
  console.log('4. Update .env file with new password');
  console.log('5. Test: npm run test:db\n');

} catch (error) {
  console.log('❌ Error parsing connection string:', error.message);
  console.log('\nYour connection string format is invalid.');
  console.log('\nCorrect format:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?options');
}
