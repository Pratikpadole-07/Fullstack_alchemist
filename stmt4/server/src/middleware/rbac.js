/**
 * Ensures the authenticated user has one of the allowed global account types.
 */
export function requireAccountTypes(...types) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!types.includes(req.user.accountType)) {
      return res.status(403).json({ error: 'Insufficient account type for this action' });
    }
    next();
  };
}

/**
 * Admin / reviewer operations (mock compliance officer).
 */
export function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(503).json({ error: 'Admin operations not configured' });
  const provided = req.headers['x-admin-secret'];
  if (provided !== secret) return res.status(403).json({ error: 'Forbidden' });
  next();
}
