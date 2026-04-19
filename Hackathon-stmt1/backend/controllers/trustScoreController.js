const User = require("../models/User");
const Verification = require("../models/Verification");

/* =========================
   TRUST SCORE CALCULATOR
========================= */
function computeScore({ user, verification }) {
  const breakdown = {};

  /* Basic Verification */
  breakdown.emailVerified =
    user?.isEmailVerified ? 10 : 0;

  breakdown.phoneVerified =
    user?.isPhoneVerified ? 10 : 0;

  /* Identity Verification */
  const approved =
    verification?.status === "approved";

  breakdown.idVerified =
    approved && verification?.idDocument
      ? 25
      : 0;

  breakdown.selfieMatched =
    approved && verification?.selfieImage
      ? 15
      : 0;

  /* Professional Verification */
  breakdown.companyEmail =
    verification?.companyEmail
      ? 15
      : 0;

  /* Social OAuth Verification */
  breakdown.githubVerified =
    user?.verification?.githubConnected
      ? 15
      : 0;

  breakdown.twitterVerified =
    user?.verification?.twitterConnected
      ? 10
      : 0;

  /* Public Presence */
  const socialLinks =
    verification?.linkedin ||
    verification?.website ||
    verification?.socials?.instagram;

  breakdown.publicPresence =
    socialLinks ? 5 : 0;

  /* Account Age + Activity */
  const createdAt = user?.createdAt
    ? new Date(user.createdAt).getTime()
    : Date.now();

  const lastActiveAt = user?.lastActiveAt
    ? new Date(user.lastActiveAt).getTime()
    : 0;

  const ageDays =
    (Date.now() - createdAt) /
    (1000 * 60 * 60 * 24);

  const activeRecently =
    lastActiveAt &&
    Date.now() - lastActiveAt <
      1000 * 60 * 60 * 24 * 30;

  breakdown.longTermActivity =
    ageDays >= 7 && activeRecently
      ? 5
      : 0;

  /* Total */
  let total = Object.values(
    breakdown
  ).reduce((sum, val) => sum + val, 0);

  total = Math.max(0, Math.min(100, total));

  return {
    total,
    breakdown
  };
}

/* =========================
   BADGE LOGIC
========================= */
function badgeFromScore(score) {
  if (score >= 80) return "Trusted";
  if (score >= 50) return "Verified";
  return "Unverified";
}

/* =========================
   RECALCULATE + SAVE
========================= */
async function recalculateTrustScore(userId) {
  const user = await User.findById(userId);

  if (!user) return null;

  const verification =
    await Verification.findOne({
      userId: user._id
    });

  const score = computeScore({
    user,
    verification
  });

  const badge = badgeFromScore(
    score.total
  );

  await User.findByIdAndUpdate(
    user._id,
    {
      trustScore: score.total,
      badge
    }
  );

  return {
    userId: user._id,
    ...score,
    badge
  };
}

/* =========================
   GET TRUST SCORE
========================= */
async function getTrustScore(req, res) {
  try {
    const { userId } = req.params;

    const result =
      await recalculateTrustScore(userId);

    if (!result) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(result);
  } catch (err) {
    console.log(
      "Trust Score Error:",
      err.message
    );

    res.status(500).json({
      message:
        "Failed to calculate trust score"
    });
  }
}

module.exports = {
  getTrustScore,
  recalculateTrustScore
};