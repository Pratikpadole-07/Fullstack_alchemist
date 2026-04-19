const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  target: String,
  type: { type: String, enum: ["email", "phone"] },
  otpHash: String,
  expiresAt: Date,
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Otp", otpSchema);