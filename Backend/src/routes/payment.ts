import express from "express";
import { authenticate, adminOnly } from "../middlewares/auth.js";
import { paymentLimiter } from "../middlewares/rate-limit.js";
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  newCoupon,
  updateCoupon,
  getEligibleCoupons
} from "../controllers/payment.js";

const app = express.Router();

// route - /api/v1/payment/create
app.post("/create", paymentLimiter, authenticate, createPaymentIntent);

// route - /api/v1/payment/coupon/new
app.get("/discount", applyDiscount);

// route - /api/v1/payment/coupon/new
app.post("/coupon/new", authenticate, adminOnly, newCoupon);

// route - /api/v1/payment/coupon/eligible
app.post("/coupon/eligible", getEligibleCoupons);

// route - /api/v1/payment/coupon/all
app.get("/coupon/all", authenticate, allCoupons);

// route - /api/v1/payment/coupon/:id
app.put("/coupon/:id", authenticate, adminOnly, updateCoupon);
app.delete("/coupon/:id", authenticate, adminOnly, deleteCoupon);

export default app;