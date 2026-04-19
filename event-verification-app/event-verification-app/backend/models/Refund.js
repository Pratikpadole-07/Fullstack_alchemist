import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    razorpayRefundId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Refund", refundSchema);
