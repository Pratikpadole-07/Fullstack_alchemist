require('dotenv').config()

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const oauthRoutes = require("./routes/oauthRoutes");


const { connectDB } = require('./utils/db')
const { notFound, errorHandler } = require('./middleware/error')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const verificationRoutes = require('./routes/verificationRoutes')
const trustScoreRoutes = require('./routes/trustScoreRoutes')
const adminRoutes = require('./routes/adminRoutes')
const reportRoutes = require('./routes/reportRoutes')

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB(process.env.MONGODB_URI)

  const app = express()

  const uploadDir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'],
    })
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan('dev'))

  app.use("/api/oauth", oauthRoutes);


  app.get('/health', (req, res) => res.json({ ok: true }))
  app.use('/uploads', express.static(uploadDir))

  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/verify', verificationRoutes)
  app.use('/api/trust-score', trustScoreRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/reports', reportRoutes)

  app.use(notFound)
  app.use(errorHandler)

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

