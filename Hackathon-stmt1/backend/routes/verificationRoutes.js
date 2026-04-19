const express = require("express");
const path = require("path");

const { requireAuth } = require("../middleware/auth");

const {
  getMyVerification,
  emailOtp,
  phoneOtp,
  uploadSelfie,
  professional
} = require("../controllers/verificationController");

const {
  uploadGovernmentId
} = require("../controllers/ocrController");

const { makeUploader } = require("../utils/uploads");

const router = express.Router();

/* =========================
   UPLOAD CONFIG
========================= */
const upload = makeUploader({
  folder: path.join(
    __dirname,
    "..",
    "uploads"
  )
});

/* =========================
   GET MY VERIFICATION
========================= */
router.get(
  "/my",
  requireAuth,
  getMyVerification
);

/* =========================
   EMAIL OTP
========================= */
router.post(
  "/email",
  requireAuth,
  emailOtp
);

/* =========================
   PHONE OTP
========================= */
router.post(
  "/phone",
  requireAuth,
  phoneOtp
);

/* =========================
   OCR GOVERNMENT ID UPLOAD
========================= */
router.post(
  "/id-upload",
  requireAuth,
  upload.single(
    "idDocument"
  ),
  uploadGovernmentId
);

/* =========================
   SELFIE UPLOAD
========================= */
router.post(
  "/selfie-upload",
  requireAuth,
  upload.single(
    "selfieImage"
  ),
  uploadSelfie
);

/* =========================
   PROFESSIONAL DETAILS
========================= */
router.post(
  "/professional",
  requireAuth,
  professional
);

module.exports = router;