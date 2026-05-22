import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import validator from "validator";
import { User } from "../models/user.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import {
  RegisterRequestBody,
  LoginRequestBody,
  RefreshTokenRequestBody,
} from "../types/types.js";
import { getJwtSecrets } from "../utils/jwt-config.js";

// ─── Token helpers ──────────────────────────────────────────────────────────

const { access: JWT_SECRET, refresh: JWT_REFRESH_SECRET } = getJwtSecrets();

const ACCESS_TOKEN_EXPIRY = "15m"; // short-lived
const REFRESH_TOKEN_EXPIRY = "7d"; // long-lived

function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/api/v1/auth",
  });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Creates a new user account (role defaults to "user").
 */
export const register = TryCatch(
  async (
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, password, gender, dob, photo } = req.body;

    if (!name || !email || !password || !gender || !dob) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!validator.isEmail(normalizedEmail)) {
      return next(new ErrorHandler("Please provide a valid email address", 400));
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return next(new ErrorHandler("An account with this email already exists", 409));
    }

    // Create user – password hashed via pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      gender,
      dob: new Date(dob),
      photo: photo || "",
    });

    // Issue tokens
    const accessToken = signAccessToken(String(user._id), user.role);
    const refreshToken = signRefreshToken(String(user._id));

    // Persist refresh token in DB (support multiple devices)
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}!`,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        role: user.role,
        gender: user.gender,
        dob: user.dob,
      },
    });
  }
);

/**
 * POST /api/v1/auth/login
 * Authenticates credentials and returns tokens.
 */
export const login = TryCatch(
  async (
    req: Request<{}, {}, LoginRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please provide email and password", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!validator.isEmail(normalizedEmail)) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    // Explicitly select password (excluded by default)
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +refreshTokens");

    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    const accessToken = signAccessToken(String(user._id), user.role);
    const refreshToken = signRefreshToken(String(user._id));

    // Append new refresh token (keep list trimmed to last 5 devices)
    const updatedTokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
    user.refreshTokens = updatedTokens;
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        role: user.role,
        gender: user.gender,
        dob: user.dob,
      },
    });
  }
);

/**
 * POST /api/v1/auth/refresh
 * Accepts a refresh token (cookie OR body) and issues a new access token.
 */
export const refreshAccessToken = TryCatch(
  async (
    req: Request<{}, {}, RefreshTokenRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const token: string | undefined =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return next(new ErrorHandler("Refresh token required", 401));
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      return next(new ErrorHandler("Invalid or expired refresh token", 401));
    }

    const user = await User.findById(payload.id).select("+refreshTokens");
    if (!user || !user.refreshTokens?.includes(token)) {
      // Possible token reuse – clear all tokens (security measure)
      if (user) {
        user.refreshTokens = [];
        await user.save({ validateBeforeSave: false });
      }
      return next(new ErrorHandler("Refresh token revoked", 401));
    }

    // Rotate: replace old token with new one
    const newRefreshToken = signRefreshToken(String(user._id));
    user.refreshTokens = [
      ...user.refreshTokens.filter((t) => t !== token),
      newRefreshToken,
    ].slice(-5);
    await user.save({ validateBeforeSave: false });

    const newAccessToken = signAccessToken(String(user._id), user.role);

    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  }
);

/**
 * POST /api/v1/auth/logout
 * Revokes the supplied refresh token.
 */
export const logout = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const token: string | undefined =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (token) {
    // Remove this token from the user's stored list
    await User.findOneAndUpdate(
      { refreshTokens: token },
      { $pull: { refreshTokens: token } }
    );
  }

  // Clear cookie regardless
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });

  return res.status(200).json({ success: true, message: "Logged out successfully" });
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 * Requires the `authenticate` middleware to run first.
 */
export const getMe = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
  // req.user is set by the authenticate middleware
  const userId = (req as any).user?.id;
  if (!userId) return next(new ErrorHandler("Not authenticated", 401));

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  return res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      gender: user.gender,
      dob: user.dob,
      age: user.age,
      createdAt: user.createdAt,
    },
  });
});
