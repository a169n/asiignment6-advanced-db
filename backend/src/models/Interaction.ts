import mongoose, { Schema, type Document, type Model } from "mongoose";

export type InteractionType = "view" | "like" | "purchase";

export interface IInteraction extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  type: InteractionType;
  createdAt: Date;
}

const interactionSchema = new Schema<IInteraction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    type: { type: String, enum: ["view", "like", "purchase"], required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

interactionSchema.index({ user: 1, product: 1, type: 1 }, { unique: false });

export const Interaction: Model<IInteraction> =
  mongoose.models.Interaction || mongoose.model<IInteraction>("Interaction", interactionSchema);
