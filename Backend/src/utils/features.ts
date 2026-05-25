import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import ErrorHandler from "./utility-class.js";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommerce",
      // Keep the connection pool alive on Render / Atlas
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    })
    .then((c) => {
      console.log(`DB Connected to ${c.connection.host}`);
    })
    .catch((e) => {
      console.error("MongoDB connection error:", e);
      process.exit(1); // fail fast so Render restarts the dyno cleanly
    });
};

export const invalidateCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "all-products",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));

    myCache.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(ordersKeys);
  }
  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  const productIds = orderItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).select([
    "_id",
    "stock",
    "name",
  ]);

  const stockByProduct = new Map(
    products.map((product) => [String(product._id), product])
  );

  for (const item of orderItems) {
    const product = stockByProduct.get(item.productId);
    if (!product) throw new ErrorHandler(`Product not found: ${item.name}`, 404);
    if (product.stock < item.quantity)
      throw new ErrorHandler(
        `Only ${product.stock} ${product.name} left in stock`,
        400
      );
  }

  await Product.bulkWrite(
    orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: -item.quantity } },
      },
    }))
  );
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  // Single aggregation instead of N separate countDocuments calls
  const agg = await Product.aggregate<{ _id: string; count: number }>([
    { $match: { category: { $in: categories } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(agg.map((r) => [r._id, r.count]));

  return categories.map((category) => ({
    [category]: productsCount
      ? Math.round(((countMap.get(category) ?? 0) / productsCount) * 100)
      : 0,
  })) as Record<string, number>[];
};

interface ChartDocument {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: ChartDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};
