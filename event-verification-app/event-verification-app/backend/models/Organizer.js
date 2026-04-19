import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    pastSuccessfulEvents: { type: Number, default: 0 },
    cancelRate: { type: Number, default: 0, min: 0, max: 1 },
    paymentVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model("Organizer", organizerSchema);
