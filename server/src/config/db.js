const mongoose = require('mongoose');

// Safe to call on every request in a serverless environment: reuses the
// existing connection instead of opening a new one each invocation.
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return mongoose.connection;
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = connectDB;
