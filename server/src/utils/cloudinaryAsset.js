import cloudinary from '../config/cloudinary.js';

// ".../image/upload/v1712345/academia-farhat/productos/abc.jpg" -> "academia-farhat/productos/abc"
function publicIdFromUrl(url) {
  const match = /\/image\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(academia-farhat\/.+)\.[a-z0-9]+$/i.exec(url || '');
  return match?.[1] || null;
}

// Best-effort cleanup of a photo that's no longer used. Never throws: a leftover
// file in Cloudinary is harmless, a failed save because of it would not be.
export async function destroyImage(url) {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Could not delete Cloudinary image', publicId, err.message);
  }
}
