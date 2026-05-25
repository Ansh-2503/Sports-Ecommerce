import mongoose, { Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  photo: string;
  role: "admin" | "user";
  gender: "male" | "female";
  dob: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  // Virtual
  age: number;
  // Methods
  comparePassword(candidate: string): Promise<boolean>;
}

const schema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter your email"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => validator.default.isEmail(v),
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never return password in queries by default
    },
    photo: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Please specify gender"],
    },
    dob: {
      type: Date,
      required: [true, "Please enter your date of birth"],
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
schema.index({ role: 1, createdAt: -1 });

// Virtual: age computed from dob
schema.virtual("age").get(function (this: IUser) {
  const today = new Date();
  const dob = this.dob;
  let age = today.getFullYear() - dob.getFullYear();
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }
  return age;
});

// Pre-save: hash password only when modified
schema.pre("save", async function (this: IUser, next) {
  if (!this.isModified("password")) return next();
  // rounds=10 (~160ms) vs rounds=12 (~640ms) — 4× faster on Render's shared CPU, still secure
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare plaintext password with hash
schema.methods.comparePassword = async function (
  this: IUser,
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>("User", schema);
