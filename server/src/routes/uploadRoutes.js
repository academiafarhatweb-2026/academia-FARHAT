import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { galleryUpload, productImageUpload } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'academia-farhat', ...options }, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

router.post(
  '/',
  galleryUpload,
  asyncHandler(async (req, res) => {
    const urls = await Promise.all((req.files || []).map((f) => uploadBuffer(f.buffer)));
    res.status(201).json({ urls });
  })
);

// Product photos are optimized once, on the way in: capped at 1600px and
// recompressed, so the stored original is already light. The site then asks
// Cloudinary for WebP/AVIF at the exact size each place needs (see assetUrl).
router.post(
  '/product-image',
  productImageUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Elegí una foto para el producto.');
    const url = await uploadBuffer(req.file.buffer, {
      folder: 'academia-farhat/productos',
      transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
    });
    res.status(201).json({ url });
  })
);

export default router;
