const express = require('express')
const { getProfile, updateProfile } = require('../controllers/userController')
const { requireAuth } = require('../middleware/auth')
const path = require('path')
const { makeUploader } = require('../utils/uploads')

const router = express.Router()
const upload = makeUploader({ folder: path.join(__dirname, '..', 'uploads') })

router.get('/profile', requireAuth, getProfile)
router.put('/profile', requireAuth, upload.single('profileImage'), updateProfile)

module.exports = router

