const { verifyToken } = require('../utils/jwt')
const User = require('../models/User')

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Unauthorized' })

    const decoded = verifyToken(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    if (user.isSuspended) return res.status(403).json({ message: 'Account suspended' })

    req.user = user
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: 'Admin access required' })
  next();
}

module.exports = { requireAuth, requireAdmin }

