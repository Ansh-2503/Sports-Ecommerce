import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import {
  NewProductRequestBody,
  SearchRequestQuery,
  BaseQuery,
} from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
import { escapeRegex } from "../utils/escape-regex.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category, photoUrl } = req.body;
    const photo = req.file;

    if (!photo && !photoUrl) return next(new ErrorHandler("Please add photo or provide image link", 400));
    if (photo && photoUrl) {
      rm(photo.path, () => {});
      return next(new ErrorHandler("Please provide either a photo or an image link, not both", 400));
    }

    if (!name || !price || !stock || !category) {
      if (photo) {
        rm(photo.path, () => {});
      }
      return next(new ErrorHandler("Please enter all Fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo ? photo.path : photoUrl,
    });

    invalidateCache({ product: true, admin: true });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
    });
  }
);

export const getLatestProducts = TryCatch(async (req, res, next) => {
  const key = "latest-products";
  let products;

  if (myCache.has(key)) products = JSON.parse(myCache.get(key) as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5).lean();
    myCache.set(key, JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  const key = "categories";
  let categories;
  let categoryDetails;

  if (myCache.has(key)) {
    const cached = JSON.parse(myCache.get(key) as string);
    categories = cached.categories;
    categoryDetails = cached.categoryDetails;
  } else {
    categoryDetails = await Product.aggregate([
      { $group: { _id: "$category", itemCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: "$_id", itemCount: 1 } },
    ]);
    categories = categoryDetails.map((category) => category.name);
    myCache.set(key, JSON.stringify({ categories, categoryDetails }));
  }

  return res
    .setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
    .status(200).json({
      success: true,
      categories,
      categoryDetails,
    });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  return res.status(200).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  const key = `product-${req.params.id}`;
  let product;

  if (myCache.has(key)) product = JSON.parse(myCache.get(key) as string);
  else {
    product = await Product.findById(req.params.id).lean();
    if (product) myCache.set(key, JSON.stringify(product));
  }

  if (!product) return next(new ErrorHandler("Product not Found", 404));

  return res.status(200).json({
    success: true,
    product,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category, photoUrl } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not Found", 404));

  if (photo && photoUrl) {
    rm(photo.path, () => {});
    return next(new ErrorHandler("Please provide either a photo or an image link, not both", 400));
  }

  if (photo) {
    // Delete old local photo if it exists
    if (product.photo && !product.photo.startsWith("http")) {
      rm(product.photo, () => {});
    }
    product.photo = photo.path;
  } else if (photoUrl) {
    // Delete old local photo if it exists
    if (product.photo && !product.photo.startsWith("http")) {
      rm(product.photo, () => {});
    }
    product.photo = photoUrl;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category.toLowerCase();

  await product.save();
  invalidateCache({ product: true, admin: true, productId: id });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully.",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new ErrorHandler("Product not Found", 404));

  if (product.photo && !product.photo.startsWith("http")) {
    rm(product.photo, () => {});
  }

  await product.deleteOne();
  invalidateCache({ product: true, admin: true, productId: String(product._id) });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
  });
});

function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const search = queryString(req.query.search)?.trim();
    const sortRaw = queryString(req.query.sort);
    const sort = sortRaw === "asc" || sortRaw === "dsc" ? sortRaw : undefined;
    const category = queryString(req.query.category);
    const price = queryString(req.query.price);
    const minPrice = queryString(req.query.minPrice);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(process.env.PRODUCT_PER_PAGE) || 8));
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search) {
      const safe = escapeRegex(search.slice(0, 200));
      if (safe.length > 0) {
        baseQuery.name = {
          $regex: safe,
          $options: "i",
        };
      }
    }

    if (price || minPrice) {
      baseQuery.price = {};
      if (price) baseQuery.price.$lte = Number(price);
      if (minPrice) baseQuery.price.$gte = Number(minPrice);
    }

    if (category) baseQuery.category = category.toLowerCase();

    let listQuery = Product.find(baseQuery);
    if (sort) {
      listQuery = listQuery.sort({ price: sort === "asc" ? 1 : -1 });
    }
    const productsPromise = listQuery.limit(limit).skip(skip).lean();

    const [products, filteredProductsCount] = await Promise.all([
      productsPromise,
      Product.countDocuments(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredProductsCount / limit);

    return res
      .setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=30")
      .status(200).json({
        success: true,
        products,
        totalPage,
        totalProducts: filteredProductsCount,
      });
  }
);
