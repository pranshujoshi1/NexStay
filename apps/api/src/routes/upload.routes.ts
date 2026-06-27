import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware';
import { uploadImage, deleteImage } from '../controllers/upload.controller';

const router = Router();

// Store file in memory buffer (no disk writes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only JPEG, PNG, WebP and GIF images are allowed. Got: ${file.mimetype}`));
    }
  },
});

// Multer error handler
const handleMulterError = (err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Max 8MB allowed.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// POST /api/upload/image  — single image (primary route)
router.post('/image',  protect, upload.single('image'), handleMulterError, uploadImage);

// POST /api/upload/images — plural alias (backward compat)
router.post('/images', protect, upload.single('image'), handleMulterError, uploadImage);

// DELETE /api/upload/image — delete by public_id
router.delete('/image',  protect, deleteImage);
router.delete('/images', protect, deleteImage);

export default router;
