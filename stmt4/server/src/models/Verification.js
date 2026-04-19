import mongoose from 'mongoose';

/**
 * Immutable-style records for verification submissions (KYC, company docs).
 * Complements User/Company fields for audit and workflow history.
 */
const verificationSchema = new mongoose.Schema(
  {
    subjectType: { type: String, enum: ['user_kyc', 'company'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    payloadSummary: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

verificationSchema.index({ subjectType: 1, status: 1, createdAt: -1 });

export const Verification = mongoose.model('Verification', verificationSchema);
