const path = require('path')
const multer = require('multer')

function safeName(originalName) {
  const ext = path.extname(originalName || '').toLowerCase()
  const base = path.basename(originalName || 'file', ext).replace(/[^a-z0-9-_]/gi, '_').slice(0, 40)
  return `${base || 'file'}${ext || '.bin'}`
}

function makeUploader({ folder }) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, folder),
    filename: (req, file, cb) => {
      const ts = Date.now()
      cb(null, `${ts}-${safeName(file.originalname)}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 6 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype?.startsWith('image/')) return cb(new Error('Only images are allowed'))
      cb(null, true)
    },
  })
}

module.exports = { makeUploader }

