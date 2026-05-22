import { Coupon } from "../models/coupon.js";
import { Product } from "../models/product.js";
import { OrderItemType } from "../types/types.js";
import ErrorHandler from "./utility-class.js";

const TAX_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 999;

function calculateCouponDiscount(
  coupon: {
    isActive: boolean;
    expiryDate: Date;
    usedCount: number;
    usageLimit: number;
    minimumOrderAmount?: number;
    applicableCategories: string[];
    applicableProducts: string[];
    discountType: string;
    discountValue: number;
    maxDiscountAmount?: number;
  },
  subtotal: number,
  cartCategories: string[],
  cartProducts: string[]
): number {
  if (!coupon.isActive || new Date(coupon.expiryDate) < new Date()) return 0;
  if (coupon.usedCount >= coupon.usageLimit) return 0;
  if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) return 0;

  let isValidCategory = coupon.applicableCategories.length === 0;
  if (!isValidCategory) {
    isValidCategory = cartCategories.some((cat) =>
      coupon.applicableCategories
        .map((c) => c.toLowerCase())
        .includes(cat.toLowerCase())
    );
  }

  let isValidProduct = coupon.applicableProducts.length === 0;
  if (!isValidProduct) {
    isValidProduct = cartProducts.some((pId) =>
      coupon.applicableProducts.includes(pId)
    );
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

  return Math.min(Math.round(savings), subtotal);
}

/**
 * Recomputes order totals from database product prices (never trusts client amounts).
 */
export async function computeOrderTotals(
  orderItems: OrderItemType[],
  couponCode?: string
) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ErrorHandler("Order must include at least one item", 400);
  }

  const productIds = orderItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const validatedItems: OrderItemType[] = [];

  for (const item of orderItems) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      throw new ErrorHandler("Invalid order item", 400);
    }

    const product = productMap.get(String(item.productId));
    if (!product) {
      throw new ErrorHandler(`Product not found: ${item.productId}`, 404);
    }
    if (product.stock < item.quantity) {
      throw new ErrorHandler(
        `Only ${product.stock} ${product.name} left in stock`,
        400
      );
    }

    validatedItems.push({
      productId: String(product._id),
      name: product.name,
      photo: product.photo,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const subtotal = validatedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tax = Math.round(subtotal * TAX_RATE);
  const shippingCharges =
    subtotal === 0 || subtotal > FREE_SHIPPING_THRESHOLD
      ? 0
      : Math.round(subtotal * 0.05);

  let discount = 0;
  const normalizedCode = couponCode?.trim().toUpperCase();

  if (normalizedCode) {
    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (!coupon) throw new ErrorHandler("Invalid coupon code", 400);

    const categories = [
      ...new Set(
        validatedItems.map((item) => {
          const product = productMap.get(item.productId);
          return product?.category ?? "";
        })
      ),
    ].filter(Boolean);

    const productIdsInCart = validatedItems.map((i) => i.productId);
    discount = calculateCouponDiscount(
      {
        isActive: coupon.isActive,
        expiryDate: coupon.expiryDate,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        minimumOrderAmount: coupon.minimumOrderAmount,
        applicableCategories: coupon.applicableCategories,
        applicableProducts: coupon.applicableProducts.map(String),
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
      },
      subtotal,
      categories,
      productIdsInCart
    );

    if (discount === 0) {
      throw new ErrorHandler("Coupon is not applicable to this order", 400);
    }
  }

  const total = Math.max(0, subtotal + tax + shippingCharges - discount);

  return {
    orderItems: validatedItems,
    subtotal,
    tax,
    shippingCharges,
    discount,
    total,
    couponCode: normalizedCode,
  };
}
