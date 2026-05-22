import { Request, Response, NextFunction } from "express";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { Wishlist } from "../models/wishlist.js";
import { Product } from "../models/product.js";

// GET /api/v1/wishlist
export const getWishlists = TryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next(new ErrorHandler("Not Authenticated", 401));

  const wishlists = await Wishlist.find({ user: userId })
    .populate("items.product", "name photo price stock category")
    .lean();

  return res.status(200).json({
    success: true,
    wishlists,
  });
});

// POST /api/v1/wishlist
export const createWishlist = TryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next(new ErrorHandler("Not Authenticated", 401));

  const { name } = req.body;

  if (!name) return next(new ErrorHandler("Please provide wishlist name", 400));

  const existing = await Wishlist.findOne({ user: userId, name: name.trim() });
  if (existing) {
    return next(new ErrorHandler("Wishlist with this name already exists", 400));
  }

  const wishlist = await Wishlist.create({
    user: userId,
    name: name.trim(),
    items: [],
  });

  return res.status(201).json({
    success: true,
    message: "Wishlist created successfully",
    wishlist,
  });
});

// PUT /api/v1/wishlist/:id
export const updateWishlist = TryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return next(new ErrorHandler("Please provide wishlist name", 400));

  const wishlist = await Wishlist.findOne({ _id: id, user: userId });
  if (!wishlist) return next(new ErrorHandler("Wishlist not found", 404));

  const existing = await Wishlist.findOne({
    user: userId,
    name: name.trim(),
    _id: { $ne: id },
  });
  if (existing) {
    return next(new ErrorHandler("Wishlist with this name already exists", 400));
  }

  wishlist.name = name.trim();
  await wishlist.save();

  return res.status(200).json({
    success: true,
    message: "Wishlist updated successfully",
    wishlist,
  });
});

// DELETE /api/v1/wishlist/:id
export const deleteWishlist = TryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  const { id } = req.params;

  const wishlist = await Wishlist.findOneAndDelete({ _id: id, user: userId });
  if (!wishlist) return next(new ErrorHandler("Wishlist not found", 404));

  return res.status(200).json({
    success: true,
    message: "Wishlist deleted successfully",
  });
});

// POST /api/v1/wishlist/:id/items
export const addToWishlist = TryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { productId } = req.body;

  if (!productId) return next(new ErrorHandler("Please provide product ID", 400));

  const wishlist = await Wishlist.findOne({ _id: id, user: userId });
  if (!wishlist) return next(new ErrorHandler("Wishlist not found", 404));

  const product = await Product.findById(productId);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  const alreadyAdded = wishlist.items.find(
    (item) => item.product.toString() === productId
  );
  if (alreadyAdded) {
    return next(new ErrorHandler("Product already in wishlist", 400));
  }

  wishlist.items.push({ product: productId, addedAt: new Date() } as any);
  await wishlist.save();

  await wishlist.populate("items.product", "name photo price stock category");

  return res.status(200).json({
    success: true,
    message: "Product added to wishlist",
    wishlist,
  });
});

// DELETE /api/v1/wishlist/:id/items/:productId
export const removeFromWishlist = TryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  const { id, productId } = req.params;

  const wishlist = await Wishlist.findOne({ _id: id, user: userId });
  if (!wishlist) return next(new ErrorHandler("Wishlist not found", 404));

  wishlist.items = wishlist.items.filter(
    (item) => item.product.toString() !== productId
  ) as any;
  await wishlist.save();

  await wishlist.populate("items.product", "name photo price stock category");

  return res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
    wishlist,
  });
});
