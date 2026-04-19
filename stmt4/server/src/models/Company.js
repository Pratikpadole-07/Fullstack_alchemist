import mongoose from 'mongoose';

export const COMPANY_VERIFICATION = ['unverified', 'pending', 'verified'];

const repSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canChat: { type: Boolean, default: true },
    canShareDocuments: { type: Boolean, default: false },
    /** Representatives must be explicitly approved by the founder. */
    approvedByFounder: { type: Boolean, default: false },
    invitedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    legalName: { type: String, default: '', trim: true },
    officialDomain: { type: String, required: true, trim: true, lowercase: true },
    /** Mock: user proves control via matching email domain or DNS token. */
    domainVerificationMethod: { type: String, enum: ['email', 'dns'], default: 'email' },
    domainVerified: { type: Boolean, default: false },
    domainVerificationToken: { type: String, default: '' },
    registrationDocumentUrl: { type: String, default: '' },
    verificationStatus: { type: String, enum: COMPANY_VERIFICATION, default: 'unverified' },
    founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    representatives: { type: [repSchema], default: [] },
  },
  { timestamps: true }
);

companySchema.index({ officialDomain: 1 });
companySchema.index({ founder: 1 });

export const Company = mongoose.model('Company', companySchema);
