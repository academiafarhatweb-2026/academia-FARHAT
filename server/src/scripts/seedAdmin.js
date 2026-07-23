require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function seedAdmin() {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`Admin ${email} already exists`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name: 'Admin',
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'admin',
  });

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
