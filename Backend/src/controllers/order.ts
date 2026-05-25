import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { Coupon } from "../models/coupon.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { computeOrderTotals } from "../utils/order-pricing.js";
import ErrorHandler from "../utils/utility-class.js";
import { myCache } from "../app.js";

export const myOrders = TryCatch(async (req, res, next) => {
  const user = req.user?.id;
  if (!user) return next(new ErrorHandler("Please login to view orders", 401));

  const key = `my-orders-${user}`;

  let orders = [];

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find({ user }).sort({ createdAt: -1 }).lean();
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  const key = `all-orders`;

  let orders = [];

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .lean();
    myCache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name").lean();

    if (!order) return next(new ErrorHandler("Order Not Found", 404));

    myCache.set(key, JSON.stringify(order));
  }

  const requesterId = req.user?.id;
  const isAdmin = req.user?.role === "admin";
  // order.user is populated, so it's an object with _id and name
  const orderOwnerId = String((order.user as any)._id || order.user);

  if (!requesterId) {
    return next(new ErrorHandler("Please login to view this order", 401));
  }
  if (!isAdmin && orderOwnerId !== requesterId) {
    return next(new ErrorHandler("You are not allowed to view this order", 403));
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const { shippingInfo, orderItems, couponCode } = req.body;

    const user = req.user?.id;

    if (!shippingInfo || !Array.isArray(orderItems) || orderItems.length === 0 || !user) {
      return next(new ErrorHandler("Please Enter All Fields", 400));
    }

    const pricing = await computeOrderTotals(orderItems, couponCode);

    await reduceStock(pricing.orderItems);

    const order = await Order.create({
      shippingInfo,
      orderItems: pricing.orderItems,
      user,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shippingCharges: pricing.shippingCharges,
      discount: pricing.discount,
      total: pricing.total,
    });

    if (pricing.couponCode) {
      const appliedCoupon = await Coupon.findOne({ code: pricing.couponCode });
      if (appliedCoupon) {
        appliedCoupon.usedCount += 1;
        if (appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
          appliedCoupon.isActive = false;
        }
        await appliedCoupon.save();
      }
    }

    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    return res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }

  await order.save();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: String(order.user),
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not Found", 404));

  await order.deleteOne();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: String(order.user),
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
