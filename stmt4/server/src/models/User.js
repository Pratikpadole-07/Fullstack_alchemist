import mongoose from 'mongoose';

/** KYC lifecycle for identity verification. */
export const KYC_STATUS = ['unverified', 'pending', 'verified'];

/** Global account kind — company-side roles are per-company on Company doc. */
export const ACCOUNT_TYPE = ['investor', 'founder_candidate'];

const loginEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, default: '' },
    accountType: { type: String, enum: ACCOUNT_TYPE, default: 'investor' },
    kycStatus: { type: String, enum: KYC_STATUS, default: 'unverified' },
    /** Mock liveness / ID check result from automated review. */
    kycReviewNotes: { type: String, default: '' },
    governmentIdUrl: { type: String, default: '' },
    selfieUrl: { type: String, default: '' },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    /** Heuristic: public mailbox providers. */
    genericEmailDomain: { type: Boolean, default: false },
    /** Flag when user is linked to more than one company as founder/rep. */
    multiCompanyWarning: { type: Boolean, default: false },
    loginHistory: { type: [loginEntrySchema], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.model('User', userSchema);
