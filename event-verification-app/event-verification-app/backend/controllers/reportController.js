import FraudReport from "../models/FraudReport.js";
import Event from "../models/Event.js";
import { summarizeFraudReports } from "../services/aiService.js";
import { notifyWebhookStub } from "../services/notificationService.js";

export async function createReport(req, res) {
  try {
    const { eventId, reportText } = req.body;
    if (!eventId || !reportText) {
      return res.status(400).json({ message: "eventId and reportText required" });
    }
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    let aiSummary = "";
    try {
      aiSummary = await summarizeFraudReports([{ reportText }]);
    } catch {
      aiSummary = "AI unavailable; report logged.";
    }

    const report = await FraudReport.create({
      eventId,
      userId: req.user.sub,
      reportText,
      status: "open",
      aiSummary,
    });

    event.hasFraudReports = true;
    if (event.status === "approved") {
      event.status = "manual_review";
    }
    await event.save();

    await notifyWebhookStub("fraud.report_created", { reportId: report._id, eventId });

    return res.status(201).json({ report });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Report failed" });
  }
}
