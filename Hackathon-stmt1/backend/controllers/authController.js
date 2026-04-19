const { z } = require('zod')
const User = require('../models/User')
const { signToken } = require('../utils/jwt')

function toPublicUser(user) {
  const obj = user.toObject ? user.toObject() : user
  delete obj.password
  return obj
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional().default(''),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })

  const { name, email, password, phone } = parsed.data
  const existing = await User.findOne({ email }).lean()
  if (existing) return res.status(409).json({ message: 'Email already in use' })

  const user = await User.create({ name, email, password, phone })
  const token = signToken({ userId: user._id }, process.env.JWT_SECRET)
  const safeUser = await User.findById(user._id).select('-password')

  res.json({ token, user: toPublicUser(safeUser) })
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })

  const { email, password } = parsed.data
  const user = await User.findOne({ email }).select('+password')
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  if (user.isSuspended) return res.status(403).json({ message: 'Account suspended' })

  const ok = await user.comparePassword(password)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

  user.lastActiveAt = new Date()
  await user.save()

  const token = signToken({ userId: user._id }, process.env.JWT_SECRET)
  const safeUser = await User.findById(user._id).select('-password')
  res.json({ token, user: toPublicUser(safeUser) })
}

async function me(req, res) {
  res.json({ user: toPublicUser(req.user) })
}

module.exports = { register, login, me }

