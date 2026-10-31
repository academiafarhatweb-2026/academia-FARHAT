import multer from 'multer';

// SVG is left out on purpose: it can carry embedded scripts.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

// Files are kept in memory only long enough to stream them to Cloudinary (see uploadRoutes.js).
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

export default upload;
