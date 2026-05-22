import express from "express";
import { authenticate, adminOnly } from "../middlewares/auth.js";
import {
  getBarCharts,
  getDashboardStats,
  getLineCharts,
  getPieCharts,
} from "../controllers/stats.js";

const app = express.Router();

// route - /api/v1/dashboard/stats
app.get("/stats", authenticate, adminOnly, getDashboardStats);

// route - /api/v1/dashboard/pie
app.get("/pie", authenticate, adminOnly, getPieCharts);

// route - /api/v1/dashboard/bar
app.get("/bar", authenticate, adminOnly, getBarCharts);

// route - /api/v1/dashboard/line
app.get("/line", authenticate, adminOnly, getLineCharts);

export default app;