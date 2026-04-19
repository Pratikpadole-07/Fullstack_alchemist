import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    purpose: {
      type: String,
      enum: ["domain_verification"],
      default: "domain_verification",
    },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model("OTP", otpSchema);
