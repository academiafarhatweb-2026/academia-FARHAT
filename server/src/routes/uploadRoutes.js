const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'academia-farhat' }, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const urls = await Promise.all((req.files || []).map((f) => uploadBuffer(f.buffer)));
    res.status(201).json({ urls });
  })
);

module.exports = router;
