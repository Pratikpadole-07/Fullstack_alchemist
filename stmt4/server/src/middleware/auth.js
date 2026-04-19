import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Express middleware: validates Bearer JWT and loads the user.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Optional auth — sets req.user if valid token present. */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (user) {
      req.user = user;
      req.userId = user._id.toString();
    }
  } catch {
    /* ignore */
  }
  next();
}
