import { validationResult } from "express-validator";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { OTP } from "../models/OTP.js";
import { verifyCIN } from "../services/mcaService.js";
import { verifyGST } from "../services/gstService.js";
import { sendDomainOtpEmail } from "../services/emailService.js";
import { isValidCIN, isValidGSTIN, isValidEmail, emailDomain, normalizeCompanyDomain } from "../utils/validators.js";
import { namesLikelyMatch } from "../utils/nameMatch.js";
import { bestDirectorMatchScore } from "../utils/directorMatch.js";
import { computeOwnershipScore, scoreToVerificationStatus } from "../utils/ownershipScore.js";
import crypto from "crypto";

function gstStatusIsActive(status) {
  return String(status || "").toLowerCase() === "active";
}

export async function verifyCin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyName, CIN, GSTIN, domainEmail, companyDomain } = req.body;

  if (!isValidCIN(CIN)) return res.status(400).json({ message: "Invalid CIN format" });
  if (!isValidGSTIN(GSTIN)) return res.status(400).json({ message: "Invalid GSTIN format" });
  if (!isValidEmail(domainEmail)) return res.status(400).json({ message: "Invalid email" });
  const dom = normalizeCompanyDomain(companyDomain);
  if (!dom) return res.status(400).json({ message: "companyDomain is required" });
  const emDom = emailDomain(domainEmail);
  if (emDom !== dom) {
    return res.status(400).json({
      message: "Domain email must use the same domain as companyDomain",
      expectedDomain: dom,
      emailDomain: emDom,
    });
  }

  let mca;
  try {
    mca = await verifyCIN(CIN.trim().toUpperCase());
  } catch (e) {
    return res.status(502).json({ message: "MCA verification failed", detail: String(e?.message || e) });
  }

  const cinExists = Boolean(mca?.CIN || mca?.cin);
  const status = mca?.status || "";
  const companyActive = String(status).toUpperCase() === "ACTIVE" && cinExists;

  if (!cinExists) {
    return res.status(400).json({ message: "CIN not found" });
  }
  if (!companyActive) {
    return res.status(400).json({ message: "Company is not ACTIVE per MCA", mcaStatus: status });
  }

  const directors = Array.isArray(mca.directors) ? mca.directors.map((d) => ({ name: d.name })) : [];

  const cinKey = CIN.trim().toUpperCase();
  const company = await Company.findOneAndUpdate(
    { userId: req.userId, CIN: cinKey },
    {
      $set: {
        userId: req.userId,
        companyName: companyName.trim(),
        CIN: cinKey,
        GSTIN: GSTIN.trim().toUpperCase(),
        domainEmail: domainEmail.toLowerCase().trim(),
        companyDomain: dom,
        directors,
        mcaStatus: status,
        companyActive,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  return res.json({
    message: "CIN verified",
    company: {
      id: company._id,
      companyName: company.companyName,
      CIN: company.CIN,
      mcaStatus: company.mcaStatus,
      companyActive: company.companyActive,
      directors: company.directors,
    },
    mcaPreview: {
      companyName: mca.companyName,
      CIN: mca.CIN,
      status: mca.status,
      directors: mca.directors,
    },
  });
}

export async function verifyGst(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyId } = req.body;
  const company = await Company.findOne({ _id: companyId, userId: req.userId });
  if (!company) return res.status(404).json({ message: "Company record not found" });

  let gst;
  try {
    gst = await verifyGST(company.GSTIN);
  } catch (e) {
    return res.status(502).json({ message: "GST verification failed", detail: String(e?.message || e) });
  }

  const gstValid = gstStatusIsActive(gst.status);
  const gstBusinessNameMatches = namesLikelyMatch(company.companyName, gst.businessName);

  company.gstValid = gstValid && gstBusinessNameMatches;
  company.gstBusinessName = gst.businessName || "";
  company.gstBusinessNameMatches = gstBusinessNameMatches;
  await company.save();

  return res.json({
    message: "GST check complete",
    gst: {
      gstin: gst.gstin,
      businessName: gst.businessName,
      status: gst.status,
      gstValid: company.gstValid,
      businessNameMatches: gstBusinessNameMatches,
    },
  });
}

export async function matchOwner(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyId } = req.body;
  const company = await Company.findOne({ _id: companyId, userId: req.userId });
  if (!company) return res.status(404).json({ message: "Company record not found" });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const directorMatchScore = bestDirectorMatchScore(user.name, company.directors);
  company.directorMatchScore = directorMatchScore;
  await company.save();

  return res.json({
    message: "Director match evaluated",
    userName: user.name,
    directorMatchScore,
    likelyOwner: directorMatchScore >= 70,
  });
}

export async function sendOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyId } = req.body;
  const company = await Company.findOne({ _id: companyId, userId: req.userId });
  if (!company) return res.status(404).json({ message: "Company record not found" });

  const dom = company.companyDomain;
  const em = company.domainEmail;
  if (emailDomain(em) !== dom) {
    return res.status(400).json({ message: "Stored email domain does not match company domain" });
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ email: em, purpose: "domain_verification" });
  await OTP.create({ email: em, otp, expiresAt, purpose: "domain_verification" });

  try {
    if (process.env.MOCK === "true" || process.env.SKIP_EMAIL === "true") {
      return res.json({
        message: "OTP generated (email skipped — set SMTP for production)",
        devOtp: otp,
      });
    }
    await sendDomainOtpEmail(em, otp);
  } catch (e) {
    return res.status(500).json({ message: "Failed to send email", detail: String(e?.message || e) });
  }

  return res.json({ message: "OTP sent to domain email" });
}

export async function verifyOtp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyId, otp } = req.body;
  const company = await Company.findOne({ _id: companyId, userId: req.userId });
  if (!company) return res.status(404).json({ message: "Company record not found" });

  const em = company.domainEmail;
  const row = await OTP.findOne({ email: em, purpose: "domain_verification" }).sort({ createdAt: -1 });
  if (!row || row.expiresAt < new Date()) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }
  if (String(row.otp) !== String(otp).trim()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  company.domainEmailVerified = true;
  await company.save();
  await OTP.deleteOne({ _id: row._id });

  return res.json({ message: "Domain email verified", domainEmailVerified: true });
}

export async function finalizeVerification(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { companyId } = req.body;
  const company = await Company.findOne({ _id: companyId, userId: req.userId });
  if (!company) return res.status(404).json({ message: "Company record not found" });

  const ownershipScore = computeOwnershipScore({
    directorMatchScore: company.directorMatchScore,
    domainEmailVerified: company.domainEmailVerified,
    gstValid: company.gstValid,
    companyActive: company.companyActive,
  });

  const verificationStatus = scoreToVerificationStatus(ownershipScore);
  company.ownershipScore = ownershipScore;
  company.verificationStatus = verificationStatus;
  await company.save();

  return res.json({
    message: "Verification finalized",
    ownershipScore,
    verificationStatus,
    breakdown: {
      directorMatchScore: company.directorMatchScore,
      domainEmailVerified: company.domainEmailVerified,
      gstValid: company.gstValid,
      companyActive: company.companyActive,
    },
  });
}

export async function listMyCompanies(req, res) {
  const items = await Company.find({ userId: req.userId }).sort({ updatedAt: -1 }).limit(20);
  return res.json({
    companies: items.map((c) => ({
      id: c._id,
      companyName: c.companyName,
      CIN: c.CIN,
      ownershipScore: c.ownershipScore,
      verificationStatus: c.verificationStatus,
      updatedAt: c.updatedAt,
    })),
  });
}

export async function getCompany(req, res) {
  const company = await Company.findOne({ _id: req.params.id, userId: req.userId });
  if (!company) return res.status(404).json({ message: "Not found" });
  return res.json({ company });
}
