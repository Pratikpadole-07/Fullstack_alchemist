import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { recordAudit } from '../services/audit.js';
import { computeTrustScore } from '../services/trustScore.js';
import { isGenericEmailDomain } from '../utils/emailDomain.js';

const SALT_ROUNDS = 12;

export async function register(req, res) {
  try {
    const { email, password, fullName, accountType } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const genericDomain = isGenericEmailDomain(email);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName: fullName || '',
      accountType: accountType === 'founder_candidate' ? 'founder_candidate' : 'investor',
      genericEmailDomain: genericDomain,
    });
    await recordAudit({
      actor: user._id,
      action: 'USER_REGISTER',
      resource: `user:${user._id}`,
      metadata: { email: user.email },
      ip: req.ip,
    });
    await computeTrustScore(user._id);
    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.passwordHash;
    res.status(201).json({ token, user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const entry = {
      at: new Date(),
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    };
    user.loginHistory = [...(user.loginHistory || []).slice(-49), entry];
    await user.save();
    await recordAudit({
      actor: user._id,
      action: 'USER_LOGIN',
      resource: `user:${user._id}`,
      metadata: {},
      ip: req.ip,
    });
    const token = signToken(user._id);
    const safe = user.toObject();
    delete safe.passwordHash;
    res.json({ token, user: safe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function me(req, res) {
  const user = await User.findById(req.userId).select('-passwordHash').lean();
  res.json({ user });
}
