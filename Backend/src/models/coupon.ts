import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Please enter the Coupon Code"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, "Please enter the Coupon Title"],
    },
    description: {
      type: String,
      required: [true, "Please enter the Coupon Description"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Please specify the Discount Type"],
    },
    discountValue: {
      type: Number,
      required: [true, "Please enter the Discount Value"],
      validate: {
        validator: function (this: any, val: number) {
          if (this.discountType === "percentage") {
            return val > 0 && val <= 50;
          }
          return val > 0;
        },
        message: "Percentage discount must be between 1 and 50. Fixed discount must be greater than 0.",
      },
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
    applicableProducts: {
      type: [String], // Array of product ids
      default: [],
    },
    usageLimit: {
      type: Number,
      default: 1000,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: [true, "Please specify an expiration date"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

schema.index({ isActive: 1, expiryDate: 1 });

export const Coupon = mongoose.model("Coupon", schema);
