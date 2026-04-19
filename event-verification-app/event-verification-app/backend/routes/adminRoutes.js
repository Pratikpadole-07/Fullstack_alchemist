import { Router } from "express";
import {
  listReviews,
  reviewDecision,
  listReports,
  listPayments,
  completeEvent,
  cancelEvent,
} from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const r = Router();

r.use(requireAuth, requireRole("admin"));

r.get("/reviews", listReviews);
r.post("/reviews/:id/decision", reviewDecision);
r.get("/reports", listReports);
r.get("/payments", listPayments);
r.post("/events/complete", completeEvent);
r.post("/events/cancel", cancelEvent);

export default r;
