import mongoose from "mongoose";

const adminReviewSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    decision: { type: String, enum: ["approved", "rejected"], required: true },
    comments: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("AdminReview", adminReviewSchema);
