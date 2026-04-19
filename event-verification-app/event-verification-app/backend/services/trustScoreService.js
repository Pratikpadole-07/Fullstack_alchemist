/**
 * Trust score (0–100)
 * Decision:
 * >= 60 → approved
 * 40–59 → manual_review
 * < 40 → rejected
 */

export function computeTrustScore(organizer, eventLike = {}) {
  let score = 50; // ✅ base score
  const breakdown = [];

  // 🔹 POSITIVE SIGNALS

  if (organizer?.isVerified) {
    score += 20;
    breakdown.push({ rule: "verified_organizer", points: 20 });
  }

  if ((organizer?.pastSuccessfulEvents || 0) > 0) {
    score += 10;
    breakdown.push({ rule: "past_successful_events", points: 10 });
  }

  const cancelRate = organizer?.cancelRate ?? 0;
  if (cancelRate < 0.15) {
    score += 10;
    breakdown.push({ rule: "low_cancellation_rate", points: 10 });
  }

  if (eventLike.venueVerified) {
    score += 15;
    breakdown.push({ rule: "venue_verified", points: 15 });
  }

  if (!eventLike.hasFraudReports) {
    score += 10;
    breakdown.push({ rule: "no_fraud_reports", points: 10 });
  }

  if (organizer?.paymentVerified) {
    score += 10;
    breakdown.push({ rule: "payment_verified", points: 10 });
  }

  // 🔻 NEGATIVE SIGNALS (VERY IMPORTANT)

  const text = `${eventLike.title || ""} ${eventLike.description || ""}`.toLowerCase();

  if (/hurry|urgent|limited seats|pay now|contact quickly/.test(text)) {
    score -= 20;
    breakdown.push({ rule: "urgency_language_detected", points: -20 });
  }

  if ((eventLike.description || "").length < 80) {
    score -= 10;
    breakdown.push({ rule: "short_description", points: -10 });
  }

  if ((eventLike.price || 0) < 50) {
    score -= 10;
    breakdown.push({ rule: "low_price", points: -10 });
  }

  // 🔒 Normalize score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // 🎯 STATUS LOGIC (UPDATED)
  let status = "rejected";
  if (score >= 60) status = "approved";
  else if (score >= 40) status = "manual_review";

  return { score, status, breakdown };
}

// ✅ SAME LOGIC FOR CONSISTENCY
export function statusFromScore(score) {
  if (score >= 60) return "approved";
  else if (score >= 40) return "manual_review";
  return "rejected";
}