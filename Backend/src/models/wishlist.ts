import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user ID"],
    },
    name: {
      type: String,
      required: [true, "Please provide wishlist name"],
      default: "My Wishlist",
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

schema.index({ user: 1, name: 1 }, { unique: true });

export const Wishlist = mongoose.model("Wishlist", schema);
