import { Router } from "express";
import { body } from "express-validator";
import * as company from "../controllers/companyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

// 🔹 CIN Verification
const verifyCinRules = [
  body("companyName").trim().isLength({ min: 1, max: 300 }),
  body("CIN").trim().notEmpty(),
  body("GSTIN").trim().notEmpty(),
  body("domainEmail").trim().toLowerCase().isEmail(),
  body("companyDomain").trim().notEmpty(),
];

router.post("/verify-cin", verifyCinRules, company.verifyCin);

// 🔹 GST Verification (uses stored GSTIN)
router.post(
  "/verify-gst",
  [body("companyId").isMongoId()],
  company.verifyGst
);

// 🔹 Owner Matching (director vs user)
router.post(
  "/match-owner",
  [body("companyId").isMongoId()],
  company.matchOwner
);

// 🔹 Send OTP to domain email
router.post(
  "/send-otp",
  [body("companyId").isMongoId()],
  company.sendOtp
);

// 🔹 Verify OTP
router.post(
  "/verify-otp",
  [
    body("companyId").isMongoId(),
    body("otp").trim().isLength({ min: 4, max: 8 }),
  ],
  company.verifyOtp
);

// 🔹 Final Score + Status
router.post(
  "/finalize",
  [body("companyId").isMongoId()],
  company.finalizeVerification
);

// 🔹 Get user's companies
router.get("/mine", company.listMyCompanies);

// 🔹 Get single company
router.get("/:id", company.getCompany);

export default router;





// import { Router } from "express";
// import { body } from "express-validator";
// import * as company from "../controllers/companyController.js";
// import { authMiddleware } from "../middleware/authMiddleware.js";

// const router = Router();

// router.use(authMiddleware);

// const verifyCinRules = [
//   body("companyName").trim().isLength({ min: 1, max: 300 }),
//   body("CIN").trim().notEmpty(),
//   body("GSTIN").trim().notEmpty(),
//   body("domainEmail").trim().toLowerCase().isEmail(),
//   body("companyDomain").trim().notEmpty(),
// ];

// router.post("/verify-cin", verifyCinRules, company.verifyCin);

// router.post("/verify-gst", [body("companyId").isMongoId()], company.verifyGst);

// router.post("/match-owner", [body("companyId").isMongoId()], company.matchOwner);

// router.post("/send-otp", [body("companyId").isMongoId()], company.sendOtp);

// router.post(
//   "/verify-otp",
//   [body("companyId").isMongoId(), body("otp").trim().isLength({ min: 4, max: 8 })],
//   company.verifyOtp
// );

// router.post("/finalize", [body("companyId").isMongoId()], company.finalizeVerification);

// router.get("/mine", company.listMyCompanies);
// router.get("/:id", company.getCompany);

// export default router;
