import { uploadBuffer } from '../config/cloudinary.js';
import { recordAudit } from '../services/audit.js';

/** Generic document upload for chat attachments (server returns URL for message payload). */
export async function uploadDocument(req, res) {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: 'File required' });
    const up = await uploadBuffer({
      buffer: req.file.buffer,
      folder: 'messages/docs',
      publicId: `${req.userId}_${Date.now()}`,
    });
    await recordAudit({
      actor: req.userId,
      action: 'DOCUMENT_UPLOAD',
      resource: 'upload',
      metadata: { publicId: up.publicId },
      ip: req.ip,
    });
    res.json({ url: up.url, name: req.file.originalname || 'document' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
}
