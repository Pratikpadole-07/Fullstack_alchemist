import { Company } from '../models/Company.js';

/**
 * Resolves whether the user may initiate or advance a "deal" on behalf of a company.
 * Only founders and founder-approved representatives may do so.
 */
export function canActAsCompanyDealParty(company, userId) {
  const uid = userId.toString();
  if (company.founder.toString() === uid) return { ok: true, role: 'founder' };
  const rep = company.representatives.find((r) => r.user.toString() === uid);
  if (rep && rep.approvedByFounder) return { ok: true, role: 'representative' };
  return { ok: false, role: null };
}

/**
 * Blocks deal initiation for users who are not founder or approved rep.
 */
export function requireDealInitiator(req, res, next) {
  const company = req.companyContext;
  if (!company) return res.status(500).json({ error: 'Company context missing' });
  const { ok } = canActAsCompanyDealParty(company, req.userId);
  if (!ok) {
    return res.status(403).json({
      error: 'Only a verified founder or an approved representative may initiate or advance deals',
      code: 'ANTI_MIDDLEMAN',
    });
  }
  next();
}

/**
 * Loads company from :companyId param into req.companyContext.
 */
export async function loadCompanyParam(req, res, next) {
  try {
    const company = await Company.findById(req.params.companyId || req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    req.companyContext = company;
    next();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid company id' });
  }
}
