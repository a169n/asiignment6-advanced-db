import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  bio?: string;
  purchaseHistory: mongoose.Types.ObjectId[];
  likedProducts: mongoose.Types.ObjectId[];
  viewedProducts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String },
    purchaseHistory: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    likedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    viewedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
