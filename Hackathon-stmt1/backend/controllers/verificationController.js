const { z } = require("zod");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Verification = require("../models/Verification");
const User = require("../models/User");
const Otp = require("../models/Otp");
const axios = require("axios");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


async function getOrCreateVerification(userId) {
  const existing = await Verification.findOne({ userId });
  if (existing) return existing;

  return Verification.create({ userId });
}

async function getMyVerification(req, res) {
  const verification = await Verification.findOne({
    userId: req.user._id,
  });

  res.json({ verification });
}

/* ---------------- OTP ---------------- */

const otpSchema = z.object({
  action: z.enum(["send", "verify"]),
  code: z.string().optional(),
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ---------------- EMAIL OTP ---------------- */

async function emailOtp(req, res) {
  try {
    const parsed = otpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    /* SEND OTP */
    if (parsed.data.action === "send") {
      const user = await User.findById(req.user._id);

      if (!user || !user.email) {
        return res.status(400).json({ message: "Email not found" });
      }

      const otp = generateOtp();

      const otpHash = await bcrypt.hash(otp, 10);

      await Otp.create({
        userId: req.user._id,
        target: user.email,
        type: "email",
        otpHash,
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      // Replace with real email provider later
      await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. Valid for 5 minutes.`
  });

      return res.json({
        ok: true,
        message: "OTP sent to email",
      });
    }

    /* VERIFY OTP */
    const record = await Otp.findOne({
      userId: req.user._id,
      type: "email",
      used: false,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        message: "No OTP found",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    const valid = await bcrypt.compare(
      parsed.data.code,
      record.otpHash
    );

    if (!valid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    record.used = true;
    await record.save();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isEmailVerified: true },
      { new: true }
    ).select("-password");

    return res.json({
      ok: true,
      message: "Email verified",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

/* ---------------- PHONE OTP ---------------- */

async function phoneOtp(req, res) {
  try {
    /* ---------------------------------
       Validate Request Body
       Expected:
       {
         action: "send" OR "verify",
         code: "123456" (only for verify)
       }
    ----------------------------------*/
    const parsed = otpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input"
      });
    }

    /* ---------------------------------
       Find Logged-in User
    ----------------------------------*/
    const user = await User.findById(req.user._id);

    if (!user || !user.phone) {
      return res.status(400).json({
        message: "Phone number not found"
      });
    }

    /* ---------------------------------
       Clean Phone Number
       Example:
       +91 98765-43210 => 919876543210
    ----------------------------------*/
    let phone = user.phone.toString().replace(/\D/g, "");

    /* ---------------------------------
       If only 10 digits entered,
       add India country code 91
    ----------------------------------*/
    if (phone.length === 10) {
      phone = "91" + phone;
    }

    /* =================================================
       SEND OTP
    ================================================= */
    if (parsed.data.action === "send") {

      /* Generate Random 6 Digit OTP */
      const otp = generateOtp();

      /* Hash OTP before storing */
      const otpHash = await bcrypt.hash(otp, 10);

      /* Delete old unused OTPs */
      await Otp.deleteMany({
        userId: req.user._id,
        type: "phone",
        used: false
      });

      /* Save New OTP in Database */
      await Otp.create({
        userId: req.user._id,
        target: phone,
        type: "phone",
        otpHash,
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min expiry
      });

      /* Debug Console */
      console.log("OTP:", otp);
      console.log("Sending to:", phone);

      /* Send OTP using MSG91 API */
      await axios.post(
        "https://control.msg91.com/api/v5/otp",
        {
          mobile: phone,
          otp: otp,
          sender: "MSGIND",
          otp_length: 6
        },
        {
          headers: {
            authkey: process.env.MSG91_AUTH_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      /* Success Response */
      return res.json({
        ok: true,
        message: "OTP sent successfully"
      });
    }

    /* =================================================
       VERIFY OTP
    ================================================= */

    /* Find Latest Unused OTP */
    const record = await Otp.findOne({
      userId: req.user._id,
      type: "phone",
      used: false
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        message: "No OTP found"
      });
    }

    /* Check Expiry */
    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    /* Compare Entered OTP with Hashed OTP */
    const valid = await bcrypt.compare(
      parsed.data.code,
      record.otpHash
    );

    if (!valid) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    /* Mark OTP as Used */
    record.used = true;
    await record.save();

    /* Update User Verification Status */
    await User.findByIdAndUpdate(req.user._id, {
      isPhoneVerified: true
    });

    /* Success Response */
    return res.json({
      ok: true,
      message: "Phone verified successfully"
    });

  } catch (error) {

    /* Show Real Error in Console */
    console.log(
      error.response?.data || error.message
    );

    /* Server Error Response */
    return res.status(500).json({
      message: "Server error"
    });
  }
}
/* ---------------- FILE UPLOADS ---------------- */

async function uploadId(req, res) {
  if (!req.file) {
    return res.status(400).json({
      message: "idDocument is required",
    });
  }

  const verification = await getOrCreateVerification(
    req.user._id
  );

  verification.idDocument = `/uploads/${req.file.filename}`;
  verification.status = "pending";

  await verification.save();

  res.json({ verification });
}

async function uploadSelfie(req, res) {
  if (!req.file) {
    return res.status(400).json({
      message: "selfieImage is required",
    });
  }

  const verification = await getOrCreateVerification(
    req.user._id
  );

  verification.selfieImage = `/uploads/${req.file.filename}`;
  verification.status = "pending";

  await verification.save();

  res.json({ verification });
}

/* ---------------- PROFESSIONAL ---------------- */

const professionalSchema = z.object({
  companyEmail: z.string().email().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  socials: z
    .object({
      twitter: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

async function professional(req, res) {
  const parsed = professionalSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  const verification = await getOrCreateVerification(
    req.user._id
  );

  verification.companyEmail =
    parsed.data.companyEmail ?? verification.companyEmail;

  verification.linkedin =
    parsed.data.linkedin ?? verification.linkedin;

  verification.website =
    parsed.data.website ?? verification.website;

  if (parsed.data.socials) {
    verification.socials = {
      ...verification.socials?.toObject?.(),
      ...parsed.data.socials,
    };
  }

  verification.status = "pending";

  await verification.save();

  res.json({ verification });
}

module.exports = {
  getMyVerification,
  emailOtp,
  phoneOtp,
  uploadId,
  uploadSelfie,
  professional,
};