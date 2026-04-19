import { Router } from "express";
import { body } from "express-validator";
import * as auth from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

const signupRules = [
  body("name").trim().isLength({ min: 1, max: 120 }).withMessage("Name required"),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password min 8 chars"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

router.post("/signup", signupRules, auth.signup);
router.post("/login", loginRules, auth.login);
router.get("/me", authMiddleware, auth.me);

export default router;
