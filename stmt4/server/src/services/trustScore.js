import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { AuditLog } from '../models/AuditLog.js';

const KYC_WEIGHT = 35;
const COMPANY_WEIGHT = 40;
const ACTIVITY_WEIGHT = 25;

/**
 * Computes a 0–100 trust score from verification and light activity signals.
 */
export async function computeTrustScore(userId) {
  const user = await User.findById(userId);
  if (!user) return 0;

  let score = 0;
  if (user.kycStatus === 'verified') score += KYC_WEIGHT;
  else if (user.kycStatus === 'pending') score += Math.floor(KYC_WEIGHT * 0.4);

  const companies = await Company.find({
    $or: [{ founder: userId }, { 'representatives.user': userId }],
  }).lean();

  const verifiedCompany = companies.some((c) => c.verificationStatus === 'verified');
  const pendingCompany = companies.some((c) => c.verificationStatus === 'pending');
  if (verifiedCompany) score += COMPANY_WEIGHT;
  else if (pendingCompany) score += Math.floor(COMPANY_WEIGHT * 0.35);

  const recentActions = await AuditLog.countDocuments({
    actor: userId,
    createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  });
  const activityPoints = Math.min(ACTIVITY_WEIGHT, Math.floor(Math.log10(recentActions + 1) * 8));
  score += activityPoints;

  if (user.genericEmailDomain) score = Math.max(0, score - 10);
  if (user.multiCompanyWarning) score = Math.max(0, score - 8);

  score = Math.min(100, Math.round(score));
  await User.updateOne({ _id: userId }, { $set: { trustScore: score } });
  return score;
}
