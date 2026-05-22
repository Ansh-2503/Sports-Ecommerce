import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import { globalLimiter } from "./middlewares/rate-limit.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
import type { CorsOptions } from "cors";

// Importing Routes
import authRoute from "./routes/auth.js";
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
import shippingRoute from "./routes/shippingAddress.js";
import wishlistRoute from "./routes/wishlist.js";

config({
  path: "./.env",
});

const port = process.env.PORT || 4000;
const mongoURI = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";

if (process.env.NODE_ENV === "production") {
  const required = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "STRIPE_KEY"];
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.error(`[config] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);
// Cache expires after 30 minutes in production; shorter (5 min) in development
// so stale admin-stats data is auto-refreshed without a server restart.
const cacheTtlSeconds = process.env.NODE_ENV === "production" ? 1800 : 300;
export const myCache = new NodeCache({ stdTTL: cacheTtlSeconds, checkperiod: 120 });

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(globalLimiter);
app.use(mongoSanitize());

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Cookie parsing (required for httpOnly refresh-token cookie)
app.use(cookieParser());

app.use(morgan("dev"));

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (_req, res) => {
  res.send("API Working with /api/v1");
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/shipping", shippingRoute);
app.use("/api/v1/wishlist", wishlistRoute);

// Static files
app.use("/uploads", express.static("uploads"));

// Global error handler (must be last)
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Express is working on http://localhost:${port}`);
});