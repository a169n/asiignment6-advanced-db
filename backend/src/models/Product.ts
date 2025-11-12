import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProduct extends Document {
  productName: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  imageUrl: string;
  imageAlt?: string;
  rating?: number;
  popularity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, index: true },
    tags: [{ type: String }],
    imageUrl: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => {
          try {
            const url = new URL(value);
            return Boolean(url.protocol && url.host);
          } catch {
            return false;
          }
        },
        message: "imageUrl must be a valid URL"
      }
    },
    imageAlt: { type: String },
    rating: { type: Number, min: 0, max: 5, default: undefined },
    popularity: { type: Number, default: 0, index: true }
  },
  { timestamps: true }
);

productSchema.index({ productName: "text", description: "text", category: "text", tags: "text" });
productSchema.index({ popularity: -1, rating: -1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);
