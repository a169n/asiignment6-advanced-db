import mongoose, { Schema, type Document, type Model } from "mongoose";

type OrderStatus = "PLACED" | "PAID" | "FULFILLED";

export interface OrderItemSnapshot {
  productId: mongoose.Types.ObjectId;
  productName: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: OrderItemSnapshot[];
  total: number;
  status: OrderStatus;
  shippingAddress?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imageAlt: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    category: { type: String }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: OrderItemSnapshot[]) => Array.isArray(value) && value.length > 0,
        message: "orders must contain at least one item"
      }
    },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PLACED", "PAID", "FULFILLED"],
      default: "PLACED"
    },
    shippingAddress: { type: String },
    contactEmail: { type: String }
  },
  { timestamps: true }
);

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export type { OrderStatus };
