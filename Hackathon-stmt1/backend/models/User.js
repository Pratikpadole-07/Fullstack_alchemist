const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    phone: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: [
        "User",
        "Professional",
        "Public Figure"
      ],
      default: "User"
    },

    profileImage: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    /* =========================
       TRUST SYSTEM
    ========================= */
    badge: {
      type: String,
      enum: [
        "Unverified",
        "Verified",
        "Trusted",
        "Suspicious"
      ],
      default: "Unverified"
    },

    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    /* =========================
       ACCOUNT FLAGS
    ========================= */
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    isPhoneVerified: {
      type: Boolean,
      default: false
    },

    isAdmin: {
      type: Boolean,
      default: false
    },

    isSuspended: {
      type: Boolean,
      default: false
    },

    lastActiveAt: {
      type: Date,
      default: null
    },

    /* =========================
       SOCIAL / IDENTITY VERIFY
    ========================= */
    verification: {
      /* OAuth Connected */
      githubConnected: {
        type: Boolean,
        default: false
      },

      twitterConnected: {
        type: Boolean,
        default: false
      },

      linkedinConnected: {
        type: Boolean,
        default: false
      },

      /* Real Names */
      githubName: {
        type: String,
        default: ""
      },

      twitterName: {
        type: String,
        default: ""
      },

      linkedinName: {
        type: String,
        default: ""
      },

      /* Usernames */
      githubUsername: {
        type: String,
        default: ""
      },

      twitterUsername: {
        type: String,
        default: ""
      },

      /* Reputation Metrics */
      githubFollowers: {
        type: Number,
        default: 0
      },

      githubRepos: {
        type: Number,
        default: 0
      },

      linkedinHeadline: {
        type: String,
        default: ""
      },

      /* Face / Identity Checks */
      selfieImage: {
        type: String,
        default: ""
      },

      livenessPassed: {
        type: Boolean,
        default: false
      },

      faceMatchScore: {
        type: Number,
        default: 0
      },

      nameMatchScore: {
        type: Number,
        default: 0
      },

      govtNameMatched: {
        type: Boolean,
        default: false
      },

      /* Verification Status */
      verificationStatus: {
        type: String,
        enum: [
          "pending",
          "verified",
          "rejected"
        ],
        default: "pending"
      },

      verifiedAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   HASH PASSWORD BEFORE SAVE
========================= */
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});

/* =========================
   PASSWORD CHECK
========================= */
UserSchema.methods.comparePassword =
async function (plainPassword) {
  return await bcrypt.compare(
    plainPassword,
    this.password
  );
};

/* =========================
   AUTO BADGE SYSTEM
========================= */
UserSchema.methods.updateBadge =
function () {
  if (this.trustScore >= 85) {
    this.badge = "Trusted";
  } else if (this.trustScore >= 60) {
    this.badge = "Verified";
  } else if (this.trustScore < 30) {
    this.badge = "Suspicious";
  } else {
    this.badge = "Unverified";
  }
};

module.exports = mongoose.model(
  "User",
  UserSchema
);