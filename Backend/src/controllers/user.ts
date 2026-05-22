import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";

/**
 * GET /api/v1/user/all  (admin)
 * Returns all users sorted newest first.
 */
export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    users,
  });
});

/**
 * GET /api/v1/user/:id  (authenticated)
 * Returns a single user profile. Users can only view their own profile;
 * admins can view any profile.
 */
export const getUser = TryCatch(async (req, res, next) => {
  const requestedId = req.params.id;
  const requester = req.user; // set by authenticate middleware

  // Non-admin users can only fetch their own profile
  if (requester?.role !== "admin" && requester?.id !== requestedId) {
    return next(new ErrorHandler("Forbidden", 403));
  }

  const user = await User.findById(requestedId).lean();
  if (!user) return next(new ErrorHandler("User not found", 404));

  return res.status(200).json({
    success: true,
    user,
  });
});

/**
 * PATCH /api/v1/user/:id  (authenticated)
 * Allows users to update their own name / photo / gender / dob.
 * Admins can also update the `role` field.
 */
export const updateUser = TryCatch(async (req, res, next) => {
  const requestedId = req.params.id;
  const requester = req.user;

  // Users can only update their own profile
  if (requester?.role !== "admin" && requester?.id !== requestedId) {
    return next(new ErrorHandler("Forbidden", 403));
  }

  const { name, gender, dob, role, removePhoto } = req.body;
  const photo = req.file;

  const user = await User.findById(requestedId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (name) user.name = name.trim();
  if (gender) user.gender = gender;
  if (dob) user.dob = new Date(dob);
  // Only admins may change roles
  if (role && requester?.role === "admin") user.role = role;

  if (removePhoto === "true") {
    if (user.photo && !user.photo.startsWith("http")) {
      rm(user.photo, () => {});
    }
    user.photo = "";
  } else if (photo) {
    if (user.photo && !user.photo.startsWith("http")) {
      rm(user.photo, () => {});
    }
    user.photo = photo.path;
  }

  await user.save({ validateBeforeSave: true });

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

/**
 * DELETE /api/v1/user/:id  (admin only)
 */
export const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
