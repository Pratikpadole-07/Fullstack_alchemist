import mongoose from "mongoose";

const fraudReportSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportText: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed"],
      default: "open",
    },
    aiSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("FraudReport", fraudReportSchema);
