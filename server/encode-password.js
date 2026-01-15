const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 MongoDB Password URL Encoder\n');
console.log('━'.repeat(60));
console.log('\nIf your MongoDB password contains special characters like:');
console.log('  @ # $ % ^ & * ( ) + = [ ] { } | \\ : ; " \' < > , . ? /');
console.log('\nThey need to be URL-encoded for the connection string.\n');
console.log('━'.repeat(60));

rl.question('\nEnter your MongoDB password: ', (password) => {
  const encoded = encodeURIComponent(password);
  
  console.log('\n━'.repeat(60));
  console.log('\n✅ Results:\n');
  console.log('Original password:', password);
  console.log('URL-encoded password:', encoded);
  
  if (password === encoded) {
    console.log('\n✅ Your password is already safe to use (no special characters)');
  } else {
    console.log('\n⚠️  Your password contains special characters!');
    console.log('Use the URL-encoded version in your .env file');
  }
  
  console.log('\n━'.repeat(60));
  console.log('\n📝 Update your .env file:\n');
  console.log('MONGODB_URI=mongodb+srv://theprogrammerco_db_user:' + encoded + '@spark-lms.vglmqix.mongodb.net/spark-lms?appName=Spark-LMS');
  console.log('\n━'.repeat(60));
  console.log('\n💡 Common special characters and their encodings:');
  console.log('   @ → %40');
  console.log('   # → %23');
  console.log('   $ → %24');
  console.log('   % → %25');
  console.log('   & → %26');
  console.log('   + → %2B');
  console.log('   = → %3D');
  console.log('\n');
  
  rl.close();
});
