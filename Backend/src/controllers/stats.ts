import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};
  const key = "admin-stats";

  if (myCache.has(key)) {
    stats = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };
    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    // All promises fired concurrently — only fields we actually use are projected
    const [
      thisMonthProducts,
      thisMonthUsers,
      thisMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      lastMonthOrders,
      productsCount,
      usersCount,
      // Single aggregation replaces Order.find({}).select("total") full-scan
      totalRevenueResult,
      totalOrdersCount,
      lastSixMonthOrders,
      categories,
      femaleUsersCount,
      latestTransaction,
    ] = await Promise.all([
      Product.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } })
        .select("createdAt").lean(),
      User.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } })
        .select("createdAt").lean(),
      Order.find({ createdAt: { $gte: thisMonth.start, $lte: thisMonth.end } })
        .select(["createdAt", "total"]).lean(),
      Product.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } })
        .select("createdAt").lean(),
      User.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } })
        .select("createdAt").lean(),
      Order.find({ createdAt: { $gte: lastMonth.start, $lte: lastMonth.end } })
        .select(["createdAt", "total"]).lean(),
      Product.countDocuments(),
      User.countDocuments(),
      // *** KEY FIX: $group aggregation instead of fetching all orders ***
      Order.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.countDocuments(),
      Order.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } })
        .select(["createdAt", "total"]).lean(),
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      Order.find({})
        .select(["orderItems", "discount", "total", "status"])
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce((t, o) => t + (o.total || 0), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((t, o) => t + (o.total || 0), 0);

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
    };

    const revenue = totalRevenueResult[0]?.total ?? 0;
    const count = {
      revenue,
      product: productsCount,
      user: usersCount,
      order: totalOrdersCount,
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthyRevenue = new Array(6).fill(0);
    lastSixMonthOrders.forEach((order) => {
      const monthDiff = (today.getMonth() - order.createdAt.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoryCount = await getInventories({ categories, productsCount });

    const userRatio = {
      male: usersCount - femaleUsersCount,
      female: femaleUsersCount,
    };

    const modifiedLatestTransaction = latestTransaction.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      categoryCount,
      changePercent,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthyRevenue,
      },
      userRatio,
      latestTransaction: modifiedLatestTransaction,
    };

    myCache.set(key, JSON.stringify(stats));
  }

  return res.status(200).json({ success: true, stats });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-pie-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    // Replace Order.find({}) full fetch with $group aggregation
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      outOfStock,
      revenueAgg,       // *** single $group instead of fetching all orders ***
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      Order.aggregate<{
        grossIncome: number;
        discount: number;
        productionCost: number;
        burnt: number;
      }>([
        {
          $group: {
            _id: null,
            grossIncome: { $sum: "$total" },
            discount: { $sum: "$discount" },
            productionCost: { $sum: "$shippingCharges" },
            burnt: { $sum: "$tax" },
          },
        },
      ]),
      User.find({}).select(["dob"]).lean(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories = await getInventories({ categories, productsCount });

    const stockAvailablity = {
      inStock: productsCount - outOfStock,
      outOfStock,
    };

    const agg = revenueAgg[0] ?? { grossIncome: 0, discount: 0, productionCost: 0, burnt: 0 };
    const marketingCost = Math.round(agg.grossIncome * 0.3);
    const netMargin = agg.grossIncome - agg.discount - agg.productionCost - agg.burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount: agg.discount,
      productionCost: agg.productionCost,
      burnt: agg.burnt,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((i: any) => i.age < 20).length,
      adult: allUsers.filter((i: any) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i: any) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };

    charts = {
      orderFullfillment,
      productCategories,
      stockAvailablity,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [products, users, orders] = await Promise.all([
      Product.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } })
        .select("createdAt").lean(),
      User.find({ createdAt: { $gte: sixMonthsAgo, $lte: today } })
        .select("createdAt").lean(),
      Order.find({ createdAt: { $gte: twelveMonthsAgo, $lte: today } })
        .select("createdAt").lean(),
    ]);

    charts = {
      users: getChartData({ length: 6, today, docArr: users }),
      products: getChartData({ length: 6, today, docArr: products }),
      orders: getChartData({ length: 12, today, docArr: orders }),
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});

export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const baseQuery = { createdAt: { $gte: twelveMonthsAgo, $lte: today } };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt").lean(),
      User.find(baseQuery).select("createdAt").lean(),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]).lean(),
    ]);

    charts = {
      users: getChartData({ length: 12, today, docArr: users }),
      products: getChartData({ length: 12, today, docArr: products }),
      discount: getChartData({ length: 12, today, docArr: orders, property: "discount" }),
      revenue: getChartData({ length: 12, today, docArr: orders, property: "total" }),
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({ success: true, charts });
});
