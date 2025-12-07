// debug-env.js
require('dotenv').config();

console.log('🔍 Environment Variables Debug:');
console.log('='.repeat(50));
console.log('Current directory:', __dirname);
console.log('MONGO_URI exists?', !!process.env.MONGO_URI);
console.log('MONGO_URI value:', process.env.MONGO_URI ? '***' + process.env.MONGO_URI.substring(process.env.MONGO_URI.length - 30) : 'UNDEFINED');
console.log('PORT:', process.env.PORT);
console.log('All env variables:', Object.keys(process.env).filter(key => key.includes('MONGO') || key.includes('PORT')));
console.log('='.repeat(50));

// Try to read .env file directly
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('\n📄 Checking .env file at:', envPath);
console.log('.env file exists?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n📝 .env file content:');
  console.log('='.repeat(30));
  console.log(envContent);
  console.log('='.repeat(30));
}