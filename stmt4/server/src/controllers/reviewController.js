import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Verification } from '../models/Verification.js';
import { recordAudit } from '../services/audit.js';
import { computeTrustScore } from '../services/trustScore.js';

/** Mock compliance: approve or reject KYC. */
export async function reviewKyc(req, res) {
  try {
    const { userId } = req.params;
    const { approve } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.kycStatus = approve ? 'verified' : 'unverified';
    await user.save();
    await Verification.updateMany(
      { subjectType: 'user_kyc', user: userId, status: 'pending' },
      { $set: { status: approve ? 'approved' : 'rejected', reviewedAt: new Date() } }
    );
    await recordAudit({
      actor: req.userId || null,
      action: approve ? 'KYC_APPROVED' : 'KYC_REJECTED',
      resource: `user:${userId}`,
      metadata: {},
      ip: req.ip,
    });
    await computeTrustScore(userId);
    const safe = user.toObject();
    delete safe.passwordHash;
    res.json({ user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Review failed' });
  }
}

/**
 * Company becomes verified only after registration doc + domain + admin approval (mock).
 */
export async function reviewCompany(req, res) {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const { approve } = req.body;
    if (approve) {
      if (!company.domainVerified || !company.registrationDocumentUrl) {
        return res.status(400).json({
          error: 'Company must have domain verified and registration document before approval',
        });
      }
      company.verificationStatus = 'verified';
    } else {
      company.verificationStatus = 'unverified';
    }
    await company.save();
    await Verification.updateMany(
      { subjectType: 'company', company: company._id, status: 'pending' },
      { $set: { status: approve ? 'approved' : 'rejected', reviewedAt: new Date() } }
    );
    await recordAudit({
      actor: req.userId || null,
      action: approve ? 'COMPANY_VERIFIED' : 'COMPANY_REJECTED',
      resource: `company:${company._id}`,
      metadata: {},
      ip: req.ip,
    });
    await computeTrustScore(company.founder);
    res.json({ company });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Company review failed' });
  }
}
