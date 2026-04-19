import Event from "../models/Event.js";
import Organizer from "../models/Organizer.js";
import EventCheck from "../models/EventCheck.js";
import { computeTrustScore } from "../services/trustScoreService.js";
import { classifyEventText } from "../services/aiService.js";
import { notifyEmailStub } from "../services/notificationService.js";

async function getOrganizerForUser(userId) {
  return Organizer.findOne({ userId });
}

async function logCheck(eventId, checkType, result, notes) {
  await EventCheck.create({ eventId, checkType, result, notes });
}

export async function createEvent(req, res) {
  try {
    const org = await getOrganizerForUser(req.user.sub);
    if (!org) return res.status(403).json({ message: "Organizer profile required" });

    const {
      title,
      venue,
      date,
      price,
      description,
      posterUrl,
      organizerDisplayName,
      organizerContact,
      venueVerified,
    } = req.body;

    if (!title || !venue || !date || price == null) {
      return res.status(400).json({ message: "title, venue, date, price required" });
    }

    const eventDraft = {
      venueVerified: Boolean(venueVerified),
      hasFraudReports: false,
    };
    const { score, status, breakdown } = computeTrustScore(org, eventDraft);

    const event = await Event.create({
      organizerId: org._id,
      title,
      venue,
      date: new Date(date),
      price: Number(price),
      description: description || "",
      posterUrl: posterUrl || "",
      organizerDisplayName: organizerDisplayName || "",
      organizerContact: organizerContact || "",
      venueVerified: eventDraft.venueVerified,
      trustScore: score,
      status: "pending",
      hasFraudReports: false,
    });

    await logCheck(event._id, "trust_score", String(score), JSON.stringify(breakdown));

    let aiClass = { label: "normal", source: "skipped" };
    try {
      aiClass = await classifyEventText(`${title}\n${description || ""}`);
      await logCheck(event._id, "ai_text_class", aiClass.label, aiClass.source);
    } catch (e) {
      await logCheck(event._id, "ai_text_class", "error", e.message);
    }

    event.status = status;
    if (aiClass.label === "suspicious" && status === "approved") {
      event.status = "manual_review";
      await logCheck(event._id, "ai_escalation", "manual_review", "Suspicious copy auto-escalated");
    }
    await event.save();

    await notifyEmailStub({
      to: req.user.email,
      subject: `Event ${event.title} — ${event.status}`,
      body: `Trust score ${score}. Status: ${event.status}.`,
    });

    const populated = await Event.findById(event._id).populate({
      path: "organizerId",
      populate: { path: "userId", select: "name email" },
    });

    return res.status(201).json({ event: populated, trust: { score, breakdown, aiClass } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Could not create event" });
  }
}

export async function listEvents(req, res) {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;
    const events = await Event.find(q)
      .sort({ createdAt: -1 })
      .populate({ path: "organizerId", populate: { path: "userId", select: "name email" } });
    return res.json({ events });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "List failed" });
  }
}

export async function getEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id).populate({
      path: "organizerId",
      populate: { path: "userId", select: "name email role" },
    });
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Fetch failed" });
  }
}

export async function patchEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const org = await getOrganizerForUser(req.user.sub);
    const isOwner = org && event.organizerId.equals(org._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    const allowed = ["title", "venue", "date", "price", "description", "posterUrl", "venueVerified", "organizerDisplayName", "organizerContact"];
    for (const k of allowed) {
      if (req.body[k] !== undefined) event[k] = req.body[k];
    }
    if (req.body.date) event.date = new Date(req.body.date);
    if (req.body.price != null) event.price = Number(req.body.price);

    const freshOrg = isAdmin && req.body.recomputeOrganizerId
      ? await Organizer.findById(req.body.recomputeOrganizerId)
      : await Organizer.findById(event.organizerId);

    const { score, status } = computeTrustScore(freshOrg, {
      venueVerified: event.venueVerified,
      hasFraudReports: event.hasFraudReports,
    });
    event.trustScore = score;
    if (isAdmin && req.body.status) {
      event.status = req.body.status;
    } else if (!["completed", "canceled"].includes(event.status)) {
      event.status = status;
    }

    await event.save();
    const populated = await Event.findById(event._id).populate({
      path: "organizerId",
      populate: { path: "userId", select: "name email" },
    });
    return res.json({ event: populated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Update failed" });
  }
}

export async function verifyEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const org = await Organizer.findById(event.organizerId);
    const { score, status, breakdown } = computeTrustScore(org, {
      venueVerified: event.venueVerified,
      hasFraudReports: event.hasFraudReports,
    });
    event.trustScore = score;
    if (!["completed", "canceled"].includes(event.status)) {
      event.status = status;
    }
    await event.save();
    await logCheck(event._id, "trust_reverify", String(score), JSON.stringify(breakdown));
    return res.json({ event, trust: { score, status, breakdown } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Verify failed" });
  }
}

export async function approveEvent(req, res) {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate({ path: "organizerId", populate: { path: "userId", select: "name email" } });
    if (!event) return res.status(404).json({ message: "Event not found" });
    await logCheck(event._id, "admin_approve", "approved", req.body?.comments || "");
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Approve failed" });
  }
}

export async function rejectEvent(req, res) {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate({ path: "organizerId", populate: { path: "userId", select: "name email" } });
    if (!event) return res.status(404).json({ message: "Event not found" });
    await logCheck(event._id, "admin_reject", "rejected", req.body?.comments || "");
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Reject failed" });
  }
}
