const express = require('express')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const {
  pending,
  getVerification,
  approve,
  reject,
  users,
  suspend,
  activate,
  reports,
} = require('../controllers/adminController')

const router = express.Router()

router.use(requireAuth, requireAdmin)

router.get('/pending', pending)
router.get('/verification/:id', getVerification)
router.put('/approve/:id', approve)
router.put('/reject/:id', reject)
router.get('/users', users)
router.put('/suspend/:id', suspend)
router.put('/activate/:id', activate)
router.get('/reports', reports)

module.exports = router

