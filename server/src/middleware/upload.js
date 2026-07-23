const multer = require('multer');

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

// Files are kept in memory only long enough to stream them to Cloudinary (see uploadRoutes.js).
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

module.exports = upload;
