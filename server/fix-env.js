const fs = require('fs');
const path = require('path');

console.log('\n🔧 MongoDB Connection String Auto-Fixer\n');
console.log('═'.repeat(70));

const envPath = path.join(__dirname, '.env');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('\n❌ .env file not found!');
  console.log('   Creating new .env file...\n');
  
  const newEnv = `MONGODB_URI=mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority
ADMIN_PASSWORD=YourSecureAdminPassword123
PORT=4001
`;
  
  fs.writeFileSync(envPath, newEnv);
  console.log('✅ Created new .env file with correct format');
  console.log('\n📝 Please update ADMIN_PASSWORD in the .env file');
  console.log('   And verify the MongoDB password is correct\n');
  process.exit(0);
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('\n📋 Current .env file analysis:\n');

// Check current MONGODB_URI
const currentUri = envContent.match(/MONGODB_URI=(.+)/);
if (currentUri) {
  console.log('Current MONGODB_URI found');
  console.log('Checking format...\n');
  
  const uri = currentUri[1].trim();
  
  // Check if it's malformed
  if (!uri.includes('/spark-lms?') && !uri.includes('/spark-lms\r')) {
    console.log('❌ Connection string format is incorrect');
    console.log('   Fixing...\n');
    
    // Extract password if possible
    const passwordMatch = uri.match(/:([^@]+)@/);
    const password = passwordMatch ? passwordMatch[1] : 'umarawais0329';
    
    // Create correct connection string
    const correctUri = `mongodb+srv://theprogrammerco_db_user:${password}@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority`;
    
    // Replace in env content
    envContent = envContent.replace(/MONGODB_URI=.+/, `MONGODB_URI=${correctUri}`);
    
    console.log('✅ Fixed connection string format');
  } else {
    console.log('✅ Connection string format looks correct');
  }
} else {
  console.log('⚠️  MONGODB_URI not found, adding it...\n');
  envContent += '\nMONGODB_URI=mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true&w=majority\n';
}

// Check ADMIN_PASSWORD
if (!envContent.includes('ADMIN_PASSWORD=')) {
  console.log('⚠️  ADMIN_PASSWORD not found, adding it...\n');
  envContent += 'ADMIN_PASSWORD=YourSecureAdminPassword123\n';
}

// Check PORT
if (!envContent.includes('PORT=')) {
  console.log('⚠️  PORT not found, adding it...\n');
  envContent += 'PORT=4001\n';
}

// Backup original
const backupPath = path.join(__dirname, '.env.backup');
fs.writeFileSync(backupPath, fs.readFileSync(envPath));
console.log('✅ Backed up original .env to .env.backup');

// Write fixed version
fs.writeFileSync(envPath, envContent);
console.log('✅ Updated .env file with correct format\n');

console.log('═'.repeat(70));
console.log('\n🎉 .env file has been fixed!\n');
console.log('📝 Next steps:\n');
console.log('   1. Verify the password in .env is correct');
console.log('   2. Update ADMIN_PASSWORD if needed');
console.log('   3. Test connection: npm run test:db');
console.log('   4. Restart server: npm run dev\n');
console.log('═'.repeat(70));
console.log('\n💡 If password is wrong, reset it in MongoDB Atlas:');
console.log('   https://cloud.mongodb.com/ → Database Access → Edit User\n');
