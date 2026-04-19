const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    /* =========================
       FILES
    ========================= */
    idDocument: {
      type: String,
      default: ""
    },

    selfieImage: {
      type: String,
      default: ""
    },

    /* =========================
       PROFESSIONAL INFO
    ========================= */
    companyEmail: {
      type: String,
      default: ""
    },

    linkedin: {
      type: String,
      default: ""
    },

    website: {
      type: String,
      default: ""
    },

    socials: {
      twitter: {
        type: String,
        default: ""
      },

      instagram: {
        type: String,
        default: ""
      },

      linkedin: {
        type: String,
        default: ""
      }
    },

    /* =========================
       OCR DATA
    ========================= */
    ocrRawText: {
      type: String,
      default: ""
    },

    govtFullName: {
      type: String,
      default: ""
    },

    govtDob: {
      type: String,
      default: ""
    },

    maskedIdNumber: {
      type: String,
      default: ""
    },

    /* =========================
       NAME MATCHING
    ========================= */
    githubName: {
      type: String,
      default: ""
    },

    twitterName: {
      type: String,
      default: ""
    },

    manualName: {
      type: String,
      default: ""
    },

    nameMatchScore: {
      type: Number,
      default: 0
    },

    nameVerified: {
      type: Boolean,
      default: false
    },

    reviewFlag: {
      type: Boolean,
      default: false
    },

    /* =========================
       REVIEW STATUS
    ========================= */
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected"
      ],
      default: "pending"
    },

    reviewNotes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Verification",
  VerificationSchema
);