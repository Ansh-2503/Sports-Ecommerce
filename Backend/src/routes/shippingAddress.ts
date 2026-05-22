import express from "express";
import {
  getShippingAddress,
  saveShippingAddress,
  deleteShippingAddress,
} from "../controllers/shippingAddress.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET    /api/v1/shipping      — fetch current user's shipping address
// POST   /api/v1/shipping      — create or update shipping address
// DELETE /api/v1/shipping      — remove shipping address
router.route("/").get(getShippingAddress).post(saveShippingAddress).delete(deleteShippingAddress);

export default router;
