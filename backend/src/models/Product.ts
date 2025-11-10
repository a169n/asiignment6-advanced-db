import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProduct extends Document {
  productName: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, index: true },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

productSchema.index({ productName: "text", description: "text", category: "text", tags: "text" });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
