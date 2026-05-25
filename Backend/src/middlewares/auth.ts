import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";
import { getJwtSecrets } from "../utils/jwt-config.js";

const { access: JWT_SECRET } = getJwtSecrets();

// Extend Express Request to carry authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

/**
 * `authenticate` – validates the Bearer access token from the Authorization header.
 * Attaches `req.user = { id, role }` on success.
 */
export const authenticate = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ErrorHandler("Access token required. Please log in.", 401));
    }

    const token = authHeader.slice(7); // Strip "Bearer "

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err: any) {
      const message =
        err.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid access token.";
      return next(new ErrorHandler(message, 401));
    }

    // Role is embedded in the access token — no DB round-trip needed.
    // If somehow the claim is missing (old token), fall back to DB once.
    const role: string = payload.role ?? (await User.findById(payload.id).select("role").lean().then((u) => u?.role ?? ""));

    req.user = { id: payload.id as string, role };
    next();
  }
);

/**
 * `adminOnly` – must run AFTER `authenticate`.
 * Rejects requests from non-admin users.
 */
export const adminOnly = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHandler("Not authenticated", 401));
    }

    if (req.user.role !== "admin") {
      return next(
        new ErrorHandler("Access denied: Administrator privileges required", 403)
      );
    }

    next();
  }
);