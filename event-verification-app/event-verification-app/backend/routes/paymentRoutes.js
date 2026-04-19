import { Router } from "express";
import {
  createOrderHandler,
  verifyPayment,
  holdPayment,
  releasePayment,
  refundPayment,
} from "../controllers/paymentController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const r = Router();

r.post("/create-order", requireAuth, createOrderHandler);
r.post("/verify", requireAuth, verifyPayment);
r.post("/hold", requireAuth, holdPayment);
r.post("/release", requireAuth, requireRole("admin"), releasePayment);
r.post("/refund", requireAuth, requireRole("admin"), refundPayment);

export default r;
