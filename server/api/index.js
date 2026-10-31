import app from '../src/app.js';
import connectDB from '../src/config/db.js';

// Vercel serverless entry point: ensure the DB connection is ready, then
// hand the request to the same Express app used for local development.
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
