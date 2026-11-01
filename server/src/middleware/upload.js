import multer from 'multer';
import HttpError from '../utils/httpError.js';

const MB = 1024 * 1024;

// Builds a single-purpose upload middleware: files are kept in memory only long
// enough to stream them to Cloudinary, and any rejection (wrong type, too big)
// becomes a 400 with a message the admin can act on.
// SVG is never accepted: it can carry embedded scripts.
function createUpload({ types, typesLabel, maxMb, field, maxCount }) {
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * MB },
    fileFilter: (req, file, cb) =>
      types.includes(file.mimetype)
        ? cb(null, true)
        : cb(new HttpError(400, `Solo se permiten imágenes ${typesLabel}.`)),
  });
  const middleware = maxCount === 1 ? parser.single(field) : parser.array(field, maxCount);

  return (req, res, next) =>
    middleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE' ? `La imagen puede pesar como máximo ${maxMb} MB.` : 'No se pudo subir el archivo.';
        return next(new HttpError(400, message));
      }
      next(err);
    });
}

// Hero and instrument photos (HomeEditor).
export const galleryUpload = createUpload({
  types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  typesLabel: 'JPG, PNG, WEBP o GIF',
  maxMb: 8,
  field: 'files',
  maxCount: 10,
});

// Stock product photos: stricter, matching the product form's own rules.
export const productImageUpload = createUpload({
  types: ['image/jpeg', 'image/png', 'image/webp'],
  typesLabel: 'JPG, PNG o WEBP',
  maxMb: 2,
  field: 'file',
  maxCount: 1,
});
