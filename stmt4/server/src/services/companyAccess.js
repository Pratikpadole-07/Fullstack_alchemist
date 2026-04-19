import { Company } from '../models/Company.js';
import { User } from '../models/User.js';

export async function getFounderCompanies(userId) {
  return Company.find({ founder: userId }).lean();
}

export async function getRepCompanies(userId) {
  return Company.find({ 'representatives.user': userId }).lean();
}

/**
 * Role on a company for a user: founder | representative | null
 */
export function userCompanyRole(company, userId) {
  const uid = userId.toString();
  if (company.founder.toString() === uid) return 'founder';
  const rep = company.representatives.find((r) => r.user.toString() === uid);
  if (rep) return 'representative';
  return null;
}

export function isApprovedRep(company, userId) {
  const uid = userId.toString();
  const rep = company.representatives.find((r) => r.user.toString() === uid);
  return !!(rep && rep.approvedByFounder);
}

/**
 * Updates multi-company warning when user is tied to >1 company as founder or approved rep.
 */
export async function refreshMultiCompanyWarning(userId) {
  const founderCount = await Company.countDocuments({ founder: userId });
  const repCount = await Company.countDocuments({
    representatives: { $elemMatch: { user: userId, approvedByFounder: true } },
  });
  const total = founderCount + repCount;
  const multi = total > 1;
  await User.updateOne({ _id: userId }, { $set: { multiCompanyWarning: multi } });
}
