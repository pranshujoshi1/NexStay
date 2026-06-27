import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

/**
 * POST /api/upload/image  (also aliased as /images)
 * Accepts a single image file (multipart/form-data, field: "image")
 * Converts buffer → base64 data URI → Cloudinary signed upload
 * This avoids upload_stream 403 issues on some Cloudinary plans.
 */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    console.log('[upload] file:', req.file.originalname, req.file.size, 'bytes', req.file.mimetype);

    // Validate Cloudinary config
    const cfg = cloudinary.config();
    if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
      console.error('[upload] Cloudinary env not loaded:', { cloud_name: cfg.cloud_name, key: !!cfg.api_key });
      res.status(500).json({ success: false, message: 'Image service not configured' });
      return;
    }

    // Convert buffer → base64 data URI (works on all Cloudinary plans)
    const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(b64, {
      folder: 'nexstay/properties',
      overwrite: false,
    });

    console.log('[upload] ✅ success:', result.public_id);

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err: any) {
    console.error('[upload] FULL ERROR:', JSON.stringify(err, null, 2));
    res.status(500).json({
      success: false,
      message: err?.message || err?.error?.message || 'Upload failed',
      detail: process.env.NODE_ENV === 'development' ? String(err) : undefined,
    });
  }
};

/**
 * DELETE /api/upload/image
 * Deletes an image from Cloudinary by public_id
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { public_id } = req.body;
    if (!public_id) {
      res.status(400).json({ success: false, message: 'public_id is required' });
      return;
    }
    await cloudinary.uploader.destroy(public_id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Delete failed' });
  }
};
