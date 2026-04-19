import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { computeTrustScore } from '../services/trustScore.js';
import { userCompanyRole, isApprovedRep } from '../services/companyAccess.js';

export async function trustSummary(req, res) {
  const userId = req.userId;
  await computeTrustScore(userId);
  const user = await User.findById(userId).select('-passwordHash').lean();
  const companies = await Company.find({
    $or: [{ founder: userId }, { 'representatives.user': userId }],
  }).lean();

  const badges = [];
  if (user.kycStatus === 'verified') badges.push({ id: 'kyc', label: 'Identity verified' });
  if (user.genericEmailDomain) badges.push({ id: 'generic_email', label: 'Generic email domain', warning: true });
  if (user.multiCompanyWarning) badges.push({ id: 'multi_company', label: 'Linked to multiple companies', warning: true });

  for (const c of companies) {
    if (c.verificationStatus !== 'verified') continue;
    const role = userCompanyRole(c, userId);
    badges.push({ id: 'verified_company', label: `Verified Company: ${c.name}`, companyId: c._id });
    if (role === 'founder') badges.push({ id: 'verified_founder', label: 'Verified Founder', companyId: c._id });
    if (role === 'representative' && isApprovedRep(c, userId)) {
      badges.push({ id: 'verified_rep', label: 'Verified Representative', companyId: c._id });
    }
  }

  res.json({ user, badges, companies });
}
