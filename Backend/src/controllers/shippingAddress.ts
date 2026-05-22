import { Request, Response, NextFunction } from "express";
import { ShippingAddress } from "../models/shippingAddress.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";

/**
 * GET /api/v1/shipping
 * Returns the authenticated user's shipping address (or null if none).
 */
export const getShippingAddress = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));

    const address = await ShippingAddress.findOne({ user: userId }).lean();

    return res.status(200).json({
      success: true,
      shippingAddress: address || null,
    });
  }
);

/**
 * POST /api/v1/shipping
 * Creates or updates (upserts) the shipping address for the authenticated user.
 */
export const saveShippingAddress = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));

    const { address, city, state, country, pinCode } = req.body;

    if (!address || !city || !state || !country || !pinCode) {
      return next(
        new ErrorHandler("Please provide all shipping details", 400)
      );
    }

    const shippingAddress = await ShippingAddress.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pinCode: Number(pinCode),
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Shipping address saved successfully",
      shippingAddress,
    });
  }
);

/**
 * DELETE /api/v1/shipping
 * Removes the authenticated user's shipping address.
 */
export const deleteShippingAddress = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(new ErrorHandler("Not authenticated", 401));

    const address = await ShippingAddress.findOneAndDelete({ user: userId });

    if (!address) {
      return next(new ErrorHandler("No shipping address found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "Shipping address deleted successfully",
    });
  }
);
