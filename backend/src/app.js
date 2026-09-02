import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import passport from "./config/passport.js";
import workspaceRoutes from './routes/workspace.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LOOP Backend API is running 🚀",
  });
});

// Liveness check only — deliberately does not touch the database. A DB
// hiccup should not make orchestration/monitoring think the process
// itself is down; that's a separate (readiness) concern if ever needed.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/reports', reportRoutes);

export default app;
