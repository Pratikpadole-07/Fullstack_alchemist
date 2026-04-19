import mongoose from "mongoose";

const eventCheckSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    checkType: { type: String, required: true },
    result: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("EventCheck", eventCheckSchema);
