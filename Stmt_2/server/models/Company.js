import mongoose from "mongoose";

const directorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    CIN: { type: String, required: true, trim: true, uppercase: true },
    GSTIN: { type: String, required: true, trim: true, uppercase: true },
    /** Registrable domain for the business e.g. abc.com (must match domainEmail host) */
    companyDomain: { type: String, required: true, trim: true, lowercase: true },
    domainEmail: { type: String, required: true, lowercase: true, trim: true },
    directors: [directorSchema],
    /** MCA company status string e.g. ACTIVE */
    mcaStatus: { type: String, default: "" },
    companyActive: { type: Boolean, default: false },
    gstValid: { type: Boolean, default: false },
    gstBusinessName: { type: String, default: "" },
    gstBusinessNameMatches: { type: Boolean, default: false },
    /** 0–100 strength of name match to directors */
    directorMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    domainEmailVerified: { type: Boolean, default: false },
    ownershipScore: { type: Number, default: 0, min: 0, max: 100 },
    verificationStatus: {
      type: String,
      enum: ["pending", "owner_verified", "partially_verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

companySchema.index({ userId: 1, CIN: 1 }, { unique: true });

export const Company = mongoose.model("Company", companySchema);
