import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter Name"],
    },
    photo: {
      type: String,
      required: [true, "Please enter Photo"],
    },
    price: {
      type: Number,
      required: [true, "Please enter Price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter Stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter Category"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ name: "text", category: 1 });
schema.index({ category: 1, price: 1 });
schema.index({ createdAt: -1 });

export const Product = mongoose.model("Product", schema);
