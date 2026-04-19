import crypto from 'crypto';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Verification } from '../models/Verification.js';
import { uploadBuffer } from '../config/cloudinary.js';
import { recordAudit } from '../services/audit.js';
import { computeTrustScore } from '../services/trustScore.js';
import { refreshMultiCompanyWarning } from '../services/companyAccess.js';
import { extractDomain } from '../utils/emailDomain.js';

/** Only KYC-verified users may register / claim a company. */
export async function createCompany(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'Only identity-verified users may register a company' });
    }
    if (user.accountType !== 'founder_candidate') {
      return res.status(403).json({ error: 'Account must be registered as founder path to create a company' });
    }
    const { name, legalName, officialDomain, domainVerificationMethod } = req.body;
    if (!name || !officialDomain) return res.status(400).json({ error: 'name and officialDomain required' });
    const domain = officialDomain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const exists = await Company.findOne({ officialDomain: domain });
    if (exists) return res.status(409).json({ error: 'Domain already registered' });
    const token = crypto.randomBytes(12).toString('hex');
    const company = await Company.create({
      name,
      legalName: legalName || '',
      officialDomain: domain,
      domainVerificationMethod: domainVerificationMethod === 'dns' ? 'dns' : 'email',
      founder: req.userId,
      verificationStatus: 'pending',
      domainVerificationToken: token,
    });
    await Verification.create({
      subjectType: 'company',
      user: req.userId,
      company: company._id,
      status: 'pending',
      payloadSummary: `Company ${name} created`,
    });
    await recordAudit({
      actor: req.userId,
      action: 'COMPANY_CREATE',
      resource: `company:${company._id}`,
      metadata: { domain },
      ip: req.ip,
    });
    await refreshMultiCompanyWarning(req.userId);
    await computeTrustScore(req.userId);
    res.status(201).json({
      company,
      domainChallenge: {
        method: company.domainVerificationMethod,
        email: `verify@${domain}`,
        dnsTxt: `trustbridge-verify=${token}`,
        token,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not create company' });
  }
}

export async function uploadRegistrationDoc(req, res) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.founder.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the founder may upload registration documents' });
    }
    if (!req.file?.buffer) return res.status(400).json({ error: 'File required' });
    const up = await uploadBuffer({
      buffer: req.file.buffer,
      folder: 'companies/reg',
      publicId: `${company._id}_reg`,
    });
    company.registrationDocumentUrl = up.url;
    await company.save();
    await recordAudit({
      actor: req.userId,
      action: 'COMPANY_REG_DOC',
      resource: `company:${company._id}`,
      metadata: {},
      ip: req.ip,
    });
    res.json({ company });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
}

/**
 * Mock domain verification: for email method, user's email domain must match company domain.
 * For dns method, client passes the token back (simulates DNS probe).
 */
export async function verifyDomain(req, res) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.founder.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the founder may verify domain' });
    }
    const user = await User.findById(req.userId);
    const userDomain = extractDomain(user.email);
    const { dnsToken } = req.body || {};
    let ok = false;
    if (company.domainVerificationMethod === 'email') {
      ok = userDomain === company.officialDomain;
    } else {
      ok = dnsToken && dnsToken === company.domainVerificationToken;
    }
    if (!ok) {
      return res.status(400).json({
        error: 'Domain verification failed',
        hint:
          company.domainVerificationMethod === 'email'
            ? 'Sign up with a work email on the company domain, or switch to DNS verification.'
            : 'Provide the dnsToken issued at company creation.',
      });
    }
    company.domainVerified = true;
    await company.save();
    await recordAudit({
      actor: req.userId,
      action: 'COMPANY_DOMAIN_VERIFIED',
      resource: `company:${company._id}`,
      metadata: { method: company.domainVerificationMethod },
      ip: req.ip,
    });
    res.json({ company, message: 'Domain verified (mock)' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Domain verification failed' });
  }
}

export async function listMyCompanies(req, res) {
  const founder = await Company.find({ founder: req.userId }).lean();
  const rep = await Company.find({ 'representatives.user': req.userId }).lean();
  res.json({ founder, representative: rep });
}

export async function inviteRepresentative(req, res) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.founder.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the founder may invite representatives' });
    }
    const { email, canChat, canShareDocuments } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) return res.status(404).json({ error: 'User must sign up before invitation' });
    if (invitee.kycStatus !== 'verified') {
      return res.status(403).json({ error: 'Invitee must complete KYC verification first' });
    }
    if (invitee._id.toString() === company.founder.toString()) {
      return res.status(400).json({ error: 'Founder cannot be added as representative' });
    }
    const already = company.representatives.find((r) => r.user.toString() === invitee._id.toString());
    if (already) return res.status(409).json({ error: 'User already listed' });
    company.representatives.push({
      user: invitee._id,
      canChat: canChat !== false,
      canShareDocuments: !!canShareDocuments,
      approvedByFounder: false,
    });
    await company.save();
    await recordAudit({
      actor: req.userId,
      action: 'REP_INVITE',
      resource: `company:${company._id}`,
      metadata: { invitee: invitee.email },
      ip: req.ip,
    });
    res.json({ company });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Invitation failed' });
  }
}

export async function approveRepresentative(req, res) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.founder.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the founder may approve representatives' });
    }
    const repUserId = req.params.userId;
    const rep = company.representatives.find((r) => r.user.toString() === repUserId);
    if (!rep) return res.status(404).json({ error: 'Representative not found' });
    rep.approvedByFounder = true;
    await company.save();
    await recordAudit({
      actor: req.userId,
      action: 'REP_APPROVED',
      resource: `company:${company._id}`,
      metadata: { repUserId },
      ip: req.ip,
    });
    await refreshMultiCompanyWarning(repUserId);
    await computeTrustScore(repUserId);
    res.json({ company });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Approval failed' });
  }
}

export async function updateRepresentativePermissions(req, res) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.founder.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the founder may update permissions' });
    }
    const rep = company.representatives.find((r) => r.user.toString() === req.params.userId);
    if (!rep) return res.status(404).json({ error: 'Representative not found' });
    const { canChat, canShareDocuments } = req.body;
    if (typeof canChat === 'boolean') rep.canChat = canChat;
    if (typeof canShareDocuments === 'boolean') rep.canShareDocuments = canShareDocuments;
    await company.save();
    await recordAudit({
      actor: req.userId,
      action: 'REP_PERMISSIONS',
      resource: `company:${company._id}`,
      metadata: { rep: req.params.userId, canChat: rep.canChat, canShareDocuments: rep.canShareDocuments },
      ip: req.ip,
    });
    res.json({ company });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
  }
}

export async function removeRepresentative(req, res) {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.founder.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the founder may remove representatives' });
    }
    const repUserId = req.params.userId;
    company.representatives = company.representatives.filter((r) => r.user.toString() !== repUserId);
    await company.save();
    await recordAudit({
      actor: req.userId,
      action: 'REP_REMOVED',
      resource: `company:${company._id}`,
      metadata: { repUserId },
      ip: req.ip,
    });
    await refreshMultiCompanyWarning(repUserId);
    res.json({ company });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Remove failed' });
  }
}
