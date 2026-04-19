import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "Organizer", required: true },
    title: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    posterUrl: { type: String, default: "" },
    organizerDisplayName: { type: String, default: "" },
    organizerContact: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "manual_review", "rejected", "completed", "canceled"],
      default: "pending",
    },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    venueVerified: { type: Boolean, default: false },
    hasFraudReports: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
