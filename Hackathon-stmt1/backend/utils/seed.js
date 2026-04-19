require('dotenv').config()

const { connectDB } = require('./db')
const User = require('../models/User')
const Verification = require('../models/Verification')
const Report = require('../models/Report')

async function seed() {
  await connectDB(process.env.MONGODB_URI)

  await Promise.all([User.deleteMany({}), Verification.deleteMany({}), Report.deleteMany({})])

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@identitytrust.io',
    password: 'Admin123!',
    role: 'Professional',
    isAdmin: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    lastActiveAt: new Date(),
  })

  const demoPayloads = [
    {
      name: 'Aisha Khan',
      email: 'aisha@demo.com',
      password: 'Password123!',
      phone: '+1 555 0101',
      role: 'User',
      isEmailVerified: true,
      lastActiveAt: new Date(),
    },
    {
      name: 'Mateo Silva',
      email: 'mateo@demo.com',
      password: 'Password123!',
      phone: '+1 555 0102',
      role: 'Professional',
      isEmailVerified: true,
      isPhoneVerified: true,
      lastActiveAt: new Date(),
    },
    {
      name: 'Noor Ahmed',
      email: 'noor@demo.com',
      password: 'Password123!',
      phone: '+1 555 0103',
      role: 'Public Figure',
      isEmailVerified: true,
      lastActiveAt: new Date(),
    },
    {
      name: 'Chloe Martin',
      email: 'chloe@demo.com',
      password: 'Password123!',
      phone: '+1 555 0104',
      role: 'User',
      lastActiveAt: new Date(),
    },
    {
      name: 'Ethan Park',
      email: 'ethan@demo.com',
      password: 'Password123!',
      phone: '+1 555 0105',
      role: 'Professional',
      lastActiveAt: new Date(),
    },
  ]

  const demoUsers = []
  for (const payload of demoPayloads) {
    // Use create() so password hashing middleware runs.
    // eslint-disable-next-line no-await-in-loop
    demoUsers.push(await User.create(payload))
  }

  // 3 pending verification requests
  await Verification.insertMany([
    {
      userId: demoUsers[0]._id,
      companyEmail: 'aisha@startup.io',
      linkedin: 'https://linkedin.com/in/aisha-demo',
      website: 'https://example.com',
      socials: { twitter: 'https://x.com/aisha_demo', instagram: '' },
      status: 'pending',
    },
    {
      userId: demoUsers[2]._id,
      companyEmail: 'noor@media.org',
      linkedin: 'https://linkedin.com/in/noor-demo',
      website: '',
      socials: { twitter: 'https://x.com/noor_demo', instagram: 'https://instagram.com/noor_demo' },
      status: 'pending',
    },
    {
      userId: demoUsers[4]._id,
      companyEmail: 'ethan@company.com',
      linkedin: '',
      website: 'https://ethan.example',
      socials: { twitter: '', instagram: '' },
      status: 'pending',
    },
  ])

  // Fake profile reports (for admin metrics)
  await Report.insertMany([
    { reportedUser: demoUsers[0]._id, reason: 'Impersonation suspected', status: 'open' },
    { reportedUser: demoUsers[0]._id, reason: 'Stolen photos', status: 'open' },
    { reportedUser: demoUsers[3]._id, reason: 'Spam links in bio', status: 'resolved' },
  ])

  // eslint-disable-next-line no-console
  console.log('Seed complete')
  // eslint-disable-next-line no-console
  console.log('Admin login: admin@identitytrust.io / Admin123!')
  // eslint-disable-next-line no-console
  console.log('Demo login: mateo@demo.com / Password123!')

  process.exit(0)
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

