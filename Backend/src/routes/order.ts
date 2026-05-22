import express from "express";
import { authenticate, adminOnly } from "../middlewares/auth.js";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.js";

const app = express.Router();

// route - /api/v1/order/new
app.post("/new", authenticate, newOrder);

// route - /api/v1/order/my
app.get("/my", authenticate, myOrders);

// route - /api/v1/order/all (admin)
app.get("/all", authenticate, adminOnly, allOrders);

app
  .route("/:id")
  .get(authenticate, getSingleOrder)
  .put(authenticate, adminOnly, processOrder)
  .delete(authenticate, adminOnly, deleteOrder);

export default app;