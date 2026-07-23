const app = require('../src/app');
const connectDB = require('../src/config/db');

// Vercel serverless entry point: ensure the DB connection is ready, then
// hand the request to the same Express app used for local development.
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
