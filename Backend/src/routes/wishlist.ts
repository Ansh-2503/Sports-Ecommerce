import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  addToWishlist,
  createWishlist,
  deleteWishlist,
  getWishlists,
  removeFromWishlist,
  updateWishlist,
} from "../controllers/wishlist.js";

const app = express.Router();

app.use(authenticate); // Require authentication for all wishlist routes

app.route("/").get(getWishlists).post(createWishlist);
app.route("/:id").put(updateWishlist).delete(deleteWishlist);
app.route("/:id/items").post(addToWishlist);
app.route("/:id/items/:productId").delete(removeFromWishlist);

export default app;
