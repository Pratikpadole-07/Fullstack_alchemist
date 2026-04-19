import Event from "../models/Event.js";
import AdminReview from "../models/AdminReview.js";
import FraudReport from "../models/FraudReport.js";
import Payment from "../models/Payment.js";
import { adminRiskExplanation } from "../services/aiService.js";
import { summarizeFraudReports } from "../services/aiService.js";

export async function listReviews(req, res) {
  try {
    const events = await Event.find({ status: "manual_review" })
      .sort({ updatedAt: -1 })
      .populate({ path: "organizerId", populate: { path: "userId", select: "name email" } });

    const enriched = [];
    for (const ev of events) {
      const org = ev.organizerId;
      let aiRisk = "";
      try {
        aiRisk = await adminRiskExplanation(ev, org);
      } catch (e) {
        aiRisk = e.message;
      }
      enriched.push({ event: ev, aiRisk });
    }

    return res.json({ items: enriched });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load reviews" });
  }
}

export async function reviewDecision(req, res) {
  try {
    const { id } = req.params;
    const { decision, comments = "" } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approved or rejected" });
    }
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.status = decision === "approved" ? "approved" : "rejected";
    await event.save();

    await AdminReview.create({
      eventId: event._id,
      adminId: req.user.sub,
      decision,
      comments,
    });

    const populated = await Event.findById(event._id).populate({
      path: "organizerId",
      populate: { path: "userId", select: "name email" },
    });

    return res.json({ event: populated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Decision failed" });
  }
}

export async function listReports(req, res) {
  try {
    const reports = await FraudReport.find()
      .sort({ createdAt: -1 })
      .populate("eventId", "title status trustScore")
      .populate("userId", "name email");

    let batchSummary = "";
    try {
      batchSummary = await summarizeFraudReports(reports.slice(0, 8).map((r) => ({ reportText: r.reportText })));
    } catch {
      batchSummary = "AI batch summary unavailable.";
    }

    return res.json({ reports, batchSummary });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load reports" });
  }
}

export async function listPayments(req, res) {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("eventId", "title status")
      .populate("userId", "name email");
    return res.json({ payments });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed" });
  }
}

export async function completeEvent(req, res) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: "eventId required" });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Not found" });
    event.status = "completed";
    await event.save();
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed" });
  }
}

export async function cancelEvent(req, res) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: "eventId required" });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Not found" });
    event.status = "canceled";
    await event.save();
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed" });
  }
}
