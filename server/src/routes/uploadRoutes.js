import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';

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

export default router;
