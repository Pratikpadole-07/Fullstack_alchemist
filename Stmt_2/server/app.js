import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";

const app = express();

const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mock: process.env.MOCK === "true" });
});

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
