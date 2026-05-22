import express from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
} from "../controllers/auth.js";
import { authenticate } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rate-limit.js";

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", authLimiter, register);

// POST /api/v1/auth/login
router.post("/login", authLimiter, login);

// POST /api/v1/auth/logout
router.post("/logout", logout);

// POST /api/v1/auth/refresh
router.post("/refresh", authLimiter, refreshAccessToken);

// GET  /api/v1/auth/me  (protected)
router.get("/me", authenticate, getMe);

export default router;
