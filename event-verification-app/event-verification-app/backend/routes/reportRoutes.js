import { Router } from "express";
import { createReport } from "../controllers/reportController.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();
r.post("/", requireAuth, createReport);
export default r;
