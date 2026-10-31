// Imported first by every entry point (app, scripts): ES module imports are
// evaluated before the importing file's own code, so the environment has to
// be ready in a module of its own, ahead of anything that reads process.env.
import 'dotenv/config';

// Vercel runs in UTC; class slots and settlement periods are Tucumán local hours.
process.env.TZ = process.env.TZ || 'America/Argentina/Tucuman';
