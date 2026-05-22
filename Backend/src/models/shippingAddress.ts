import mongoose, { Document } from "mongoose";

export interface IShippingAddress extends Document {
  user: mongoose.Types.ObjectId;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new mongoose.Schema<IShippingAddress>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true, // One shipping address per user
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "IN",
    },
    pinCode: {
      type: Number,
      required: [true, "PIN code is required"],
    },
  },
  {
    timestamps: true,
  }
);


export const ShippingAddress = mongoose.model<IShippingAddress>(
  "ShippingAddress",
  schema
);
