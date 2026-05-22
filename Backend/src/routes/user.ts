import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
} from "../controllers/user.js";
import { authenticate, adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

// Route - /api/v1/user/all  (admin only)
router.get("/all", authenticate, adminOnly, getAllUsers);

// Route - /api/v1/user/:id
router
  .route("/:id")
  .get(authenticate, getUser)
  .patch(authenticate, singleUpload, updateUser)
  .delete(authenticate, adminOnly, deleteUser);

export default router;