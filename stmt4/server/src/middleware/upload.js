import multer from 'multer';

/** In-memory buffers for Cloudinary or mock uploads. */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});
