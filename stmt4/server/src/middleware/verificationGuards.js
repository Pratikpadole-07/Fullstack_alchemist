import { User } from '../models/User.js';

/** Both parties in a secure channel must be KYC-verified. */
export async function requireKycVerified(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user || user.kycStatus !== 'verified') {
    return res.status(403).json({
      error: 'KYC verification required',
      kycStatus: user?.kycStatus || 'unknown',
    });
  }
  next();
}
