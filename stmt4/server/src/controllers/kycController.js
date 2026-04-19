import { User } from '../models/User.js';
import { Verification } from '../models/Verification.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { recordAudit } from '../services/audit.js';
import { computeTrustScore } from '../services/trustScore.js';

/**
 * Simulated automated review: moves KYC to pending with mock liveness notes.
 */
export async function submitKyc(req, res) {
  try {
    if (!req.files?.governmentId?.[0] || !req.files?.selfie?.[0]) {
      return res.status(400).json({ error: 'Government ID and selfie files are required' });
    }
    const idBuf = req.files.governmentId[0].buffer;
    const selfieBuf = req.files.selfie[0].buffer;
    const idUpload = await uploadBuffer({
      buffer: idBuf,
      folder: 'kyc/id',
      publicId: `${req.userId}_gov`,
    });
    const selfieUpload = await uploadBuffer({
      buffer: selfieBuf,
      folder: 'kyc/selfie',
      publicId: `${req.userId}_selfie`,
    });
    const mockLivenessOk = Buffer.compare(idBuf.slice(0, 16), selfieBuf.slice(0, 16)) !== 0;
    const notes = mockLivenessOk
      ? 'Mock liveness: face match confidence 0.92 (simulated)'
      : 'Mock liveness: additional manual review suggested (simulated)';

    await User.updateOne(
      { _id: req.userId },
      {
        $set: {
          kycStatus: 'pending',
          governmentIdUrl: idUpload.url,
          selfieUrl: selfieUpload.url,
          kycReviewNotes: notes,
        },
      }
    );
    await Verification.create({
      subjectType: 'user_kyc',
      user: req.userId,
      status: 'pending',
      payloadSummary: 'ID + selfie submitted (mock review)',
    });
    await recordAudit({
      actor: req.userId,
      action: 'KYC_SUBMIT',
      resource: `user:${req.userId}`,
      metadata: { mockLivenessOk },
      ip: req.ip,
    });
    await computeTrustScore(req.userId);
    const user = await User.findById(req.userId).select('-passwordHash');
    res.json({ user, message: 'KYC submitted for review' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'KYC submission failed' });
  }
}
