const cloudinary = require('cloudinary').v2;

// Reads CLOUDINARY_URL from process.env automatically.
cloudinary.config({ secure: true });

module.exports = cloudinary;
