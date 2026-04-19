const { z } = require('zod')
const User = require('../models/User')

function toPublicUser(user) {
  const obj = user.toObject ? user.toObject() : user
  delete obj.password
  return obj
}

async function getProfile(req, res) {
  const fresh = await User.findById(req.user._id).select('-password')
  res.json({ user: toPublicUser(fresh) })
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  role: z.enum(['User', 'Professional', 'Public Figure']).optional(),
})

async function updateProfile(req, res) {
  const parsed = updateSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })

  const update = { ...parsed.data }
  if (req.file) {
    update.profileImage = `/uploads/${req.file.filename}`
  }

  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password')
  res.json({ user: toPublicUser(user) })
}

module.exports = { getProfile, updateProfile }

