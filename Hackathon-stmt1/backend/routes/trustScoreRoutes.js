const express = require('express')
const { requireAuth } = require('../middleware/auth')
const { getTrustScore } = require('../controllers/trustScoreController')

const router = express.Router()

// Auth required so users can't scrape scores
router.get('/:userId', requireAuth, getTrustScore)

module.exports = router

