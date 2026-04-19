const User = require('../models/User')
const Verification = require('../models/Verification')
const Report = require('../models/Report')

async function pending(req, res) {
  const verifications = await Verification.find({ status: 'pending' })
    .sort({ updatedAt: -1 })
    .populate('userId', 'name email trustScore isEmailVerified isPhoneVerified')
  res.json({ verifications })
}

async function getVerification(req, res) {
  const verification = await Verification.findById(req.params.id).populate(
    'userId',
    'name email trustScore isEmailVerified isPhoneVerified'
  )
  if (!verification) return res.status(404).json({ message: 'Not found' })
  res.json({ verification })
}

async function approve(req, res) {
  const verification = await Verification.findById(req.params.id)
  if (!verification) return res.status(404).json({ message: 'Not found' })
  verification.status = 'approved'
  verification.reviewNotes = req.body?.reviewNotes || ''
  await verification.save()
  res.json({ verification })
}

async function reject(req, res) {
  const verification = await Verification.findById(req.params.id)
  if (!verification) return res.status(404).json({ message: 'Not found' })
  verification.status = 'rejected'
  verification.reviewNotes = req.body?.reviewNotes || ''
  await verification.save()
  res.json({ verification })
}

async function users(req, res) {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
  res.json({ users })
}

async function suspend(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true }).select(
    '-password'
  )
  if (!user) return res.status(404).json({ message: 'Not found' })
  res.json({ user })
}

async function activate(req, res) {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true }).select(
    '-password'
  )
  if (!user) return res.status(404).json({ message: 'Not found' })
  res.json({ user })
}

async function reports(req, res) {
  const reports = await Report.find().sort({ createdAt: -1 }).limit(200)
  res.json({ reports })
}

module.exports = {
  pending,
  getVerification,
  approve,
  reject,
  users,
  suspend,
  activate,
  reports,
}

