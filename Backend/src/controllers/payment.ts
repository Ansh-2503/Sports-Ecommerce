import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";
import { computeOrderTotals } from "../utils/order-pricing.js";
import { OrderItemType } from "../types/types.js";

const ALLOWED_COUPON_UPDATE_FIELDS = new Set([
  "title",
  "description",
  "discountType",
  "discountValue",
  "maxDiscountAmount",
  "minimumOrderAmount",
  "applicableCategories",
  "applicableProducts",
  "usageLimit",
  "expiryDate",
  "isActive",
]);

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { orderItems, couponCode, shippingInfo, userName, userEmail, description } =
    req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return next(new ErrorHandler("Order items are required for payment", 400));
  }

  const pricing = await computeOrderTotals(
    orderItems as OrderItemType[],
    couponCode
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(pricing.total * 100),
    currency: "inr",
    description: (description && description.trim()) ? description.trim().substring(0, 500) : "Export of Sports Goods",
    receipt_email: userEmail || undefined,
    shipping: shippingInfo ? {
      name: userName || "Customer",
      address: {
        line1: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.pinCode,
        country: shippingInfo.country === "india" ? "IN" : shippingInfo.country,
      },
    } : undefined,
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const {
    code,
    title,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minimumOrderAmount,
    applicableCategories,
    applicableProducts,
    usageLimit,
    expiryDate,
    isActive,
  } = req.body;

  if (!code || !title || !description || !discountType || !discountValue || !expiryDate)
    return next(new ErrorHandler("Please enter all required fields", 400));

  await Coupon.create({
    code,
    title,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minimumOrderAmount,
    applicableCategories: applicableCategories || [],
    applicableProducts: applicableProducts || [],
    usageLimit: usageLimit || 1000,
    expiryDate,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user?.id,
  });

  return res.status(201).json({
    success: true,
    message: `Coupon ${code} Created Successfully`,
  });
});

export const updateCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);
  if (!coupon) return next(new ErrorHandler("Coupon Not Found", 404));

  const updates = req.body;
  Object.keys(updates).forEach((key) => {
    if (ALLOWED_COUPON_UPDATE_FIELDS.has(key)) {
      coupon.set(key, updates[key]);
    }
  });

  await coupon.save();

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} Updated Successfully`,
    coupon,
  });
});

// Helper function to calculate savings
const calculateSavings = (coupon: any, subtotal: number, cartCategories: string[], cartProducts: string[]) => {
  if (!coupon.isActive || new Date(coupon.expiryDate) < new Date()) return 0;
  if (coupon.usedCount >= coupon.usageLimit) return 0;
  if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) return 0;

  let isValidCategory = coupon.applicableCategories.length === 0;
  if (!isValidCategory) {
    isValidCategory = cartCategories.some(cat => coupon.applicableCategories.map((c: string) => c.toLowerCase()).includes(cat.toLowerCase()));
  }

  let isValidProduct = coupon.applicableProducts.length === 0;
  if (!isValidProduct) {
    isValidProduct = cartProducts.some(pId => coupon.applicableProducts.includes(pId));
  }

  if (!isValidCategory && !isValidProduct) return 0;

  let savings = 0;
  if (coupon.discountType === "percentage") {
    savings = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && savings > coupon.maxDiscountAmount) {
      savings = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "fixed") {
    savings = coupon.discountValue;
  }

  return Math.min(savings, subtotal); // cannot save more than subtotal
};

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon: code, totalPrice, category } = req.query;

  const normalizedCode = String(code).trim().toUpperCase();
  const discount = await Coupon.findOne({ code: normalizedCode });

  if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
  if (!discount.isActive || new Date(discount.expiryDate) < new Date())
    return next(new ErrorHandler("Coupon has expired or is inactive", 400));
  if (discount.usedCount >= discount.usageLimit)
    return next(new ErrorHandler("Coupon usage limit reached", 400));
  if (totalPrice && Number(totalPrice) < discount.minimumOrderAmount)
    return next(new ErrorHandler(`Minimum order amount is ₹${discount.minimumOrderAmount}`, 400));
  
  if (
    category &&
    discount.applicableCategories.length > 0 &&
    !discount.applicableCategories.map((c: string) => c.toLowerCase()).includes(String(category).toLowerCase())
  )
    return next(new ErrorHandler("Coupon is not valid for this category", 400));

  return res.status(200).json({
    success: true,
    discount,
  });
});

export const getEligibleCoupons = TryCatch(async (req, res, next) => {
  const { subtotal, categories, products } = req.body;

  if (subtotal === undefined) return next(new ErrorHandler("Subtotal is required", 400));

  const query: any = {
    isActive: true,
    expiryDate: { $gte: new Date() },
    $expr: { $lt: ["$usedCount", "$usageLimit"] },
  };

  const allActiveCoupons = await Coupon.find(query).lean();

  const eligibleCoupons = allActiveCoupons
    .map(coupon => {
      const savings = calculateSavings(coupon, subtotal, categories || [], products || []);
      return { ...coupon, savings };
    })
    .filter(c => c.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 3); // Top 3

  return res.status(200).json({
    success: true,
    coupons: eligibleCoupons,
  });
});

export const allCoupons = TryCatch(async (req, res, next) => {
  const isAdmin = req.user?.role === "admin";

  const query: any = isAdmin ? {} : {
    isActive: true,
    expiryDate: { $gte: new Date() },
    $expr: { $lt: ["$usedCount", "$usageLimit"] },
  };

  const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    coupons,
  });
});

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Invalid Coupon ID", 400));

  return res.status(200).json({
    success: true,
    message: `Coupon ${coupon.code} Deleted Successfully`,
  });
});
