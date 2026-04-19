import { Router } from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  patchEvent,
  verifyEvent,
  approveEvent,
  rejectEvent,
} from "../controllers/eventController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const r = Router();

r.get("/", listEvents);
r.get("/:id", getEvent);

r.post("/", requireAuth, requireRole("organizer", "admin"), createEvent);
r.patch("/:id", requireAuth, patchEvent);
r.post("/:id/verify", requireAuth, requireRole("organizer", "admin"), verifyEvent);
r.post("/:id/approve", requireAuth, requireRole("admin"), approveEvent);
r.post("/:id/reject", requireAuth, requireRole("admin"), rejectEvent);

export default r;
