const fs = require("fs");
const Tesseract = require("tesseract.js");

const User = require("../models/User");
const Verification = require("../models/Verification");
const { recalculateTrustScore } = require("./trustScoreController");

/* =========================
   HELPERS
========================= */
function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitWords(name = "") {
  return normalizeName(name)
    .split(" ")
    .filter(Boolean);
}

function compareNames(a = "", b = "") {
  const arr1 = splitWords(a);
  const arr2 = splitWords(b);

  if (!arr1.length || !arr2.length) {
    return 0;
  }

  let matched = 0;

  for (const word of arr1) {
    if (arr2.includes(word)) {
      matched++;
    }
  }

  const maxLen = Math.max(
    arr1.length,
    arr2.length
  );

  return Math.round(
    (matched / maxLen) * 100
  );
}

function weightedScore({
  govtName,
  manualName,
  githubName,
  twitterName
}) {
  const manual =
    compareNames(
      govtName,
      manualName
    ) * 0.35;

  const github =
    compareNames(
      govtName,
      githubName
    ) * 0.40;

  const twitter =
    compareNames(
      govtName,
      twitterName
    ) * 0.15;

  const buffer = 10;

  const total =
    manual +
    github +
    twitter +
    buffer;

  return Math.min(
    100,
    Math.round(total)
  );
}

function extractDob(text = "") {
  const match = text.match(
    /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/
  );

  return match ? match[0] : "";
}

function extractMaskedId(text = "") {
  const match =
    text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);

  if (!match) return "";

  const raw =
    match[0].replace(/\s/g, "");

  return `XXXX XXXX ${raw.slice(-4)}`;
}

function extractName(text = "") {
  const lines = text
    .split("\n")
    .map((line) =>
      line.trim()
    )
    .filter(Boolean);

  const blocked = [
    "government",
    "india",
    "dob",
    "male",
    "female",
    "year",
    "birth",
    "aadhaar",
    "authority",
    "unique"
  ];

  for (const line of lines) {
    const lower =
      line.toLowerCase();

    const hasBlocked =
      blocked.some((word) =>
        lower.includes(word)
      );

    const valid =
      /^[A-Za-z\s.]+$/.test(line) &&
      line.split(" ").length >= 2 &&
      line.length >= 5 &&
      !hasBlocked;

    if (valid) {
      return line
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return "";
}

/* =========================
   OCR USING TESSERACT
========================= */
async function readTextFromImage(
  filePath
) {
  const result =
    await Tesseract.recognize(
      filePath,
      "eng"
    );

  return (
    result?.data?.text || ""
  );
}

/* =========================
   MAIN CONTROLLER
========================= */
async function uploadGovernmentId(
  req,
  res
) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        message:
          "Unauthorized"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message:
          "ID image required"
      });
    }

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found"
      });
    }

    const filePath =
      req.file.path;

    const ocrText =
      await readTextFromImage(
        filePath
      );

    const govtFullName =
      extractName(ocrText);

    const govtDob =
      extractDob(ocrText);

    const maskedIdNumber =
      extractMaskedId(ocrText);

    const manualName =
      user.name || "";

    const githubName =
      user.verification
        ?.githubName || "";

    const twitterName =
      user.verification
        ?.twitterName || "";

    const nameMatchScore =
      weightedScore({
        govtName:
          govtFullName,
        manualName,
        githubName,
        twitterName
      });

    const nameVerified =
      nameMatchScore >= 85;

    const reviewFlag =
      nameMatchScore < 65;

    const verification =
      await Verification.findOneAndUpdate(
        {
          userId:
            user._id
        },
        {
          userId:
            user._id,

          idDocument:
            req.file.filename,

          ocrRawText:
            ocrText,

          govtFullName,
          govtDob,
          maskedIdNumber,

          githubName,
          twitterName,
          manualName,

          nameMatchScore,
          nameVerified,
          reviewFlag,

          status:
            nameVerified
              ? "approved"
              : "pending"
        },
        {
          new: true,
          upsert: true
        }
      );

    await User.findByIdAndUpdate(
      user._id,
      {
        "verification.nameMatchScore":
          nameMatchScore,

        "verification.govtNameMatched":
          nameVerified,

        lastActiveAt:
          new Date()
      }
    );

    await recalculateTrustScore(
      user._id
    );

    if (
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(
        filePath
      );
    }

    return res.json({
      message:
        "Government ID processed successfully",
      verification
    });
  } catch (err) {
    console.log(
      "OCR Error:",
      err.message
    );

    return res.status(500).json({
      message:
        "Failed to process ID"
    });
  }
}

module.exports = {
  uploadGovernmentId
};