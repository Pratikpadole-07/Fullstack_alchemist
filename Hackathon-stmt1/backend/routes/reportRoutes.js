const express = require('express')
const { requireAuth } = require('../middleware/auth')
const { againstMe, create } = require('../controllers/reportController')

const router = express.Router()

router.get('/against-me', requireAuth, againstMe)
router.post('/', requireAuth, create)

module.exports = router

