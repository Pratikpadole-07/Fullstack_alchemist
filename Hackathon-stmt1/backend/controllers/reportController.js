const { z } = require('zod')
const Report = require('../models/Report')

async function againstMe(req, res) {
  const reports = await Report.find({ reportedUser: req.user._id }).sort({ createdAt: -1 })
  res.json({ reports })
}

const createSchema = z.object({
  reportedUser: z.string().min(1),
  reason: z.string().min(3).max(240),
})

async function create(req, res) {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' })
  const report = await Report.create(parsed.data)
  res.status(201).json({ report })
}

module.exports = { againstMe, create }

