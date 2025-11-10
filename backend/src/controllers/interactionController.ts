import { Response } from "express";
import mongoose from "mongoose";
import { Interaction, type InteractionType } from "@/models/Interaction";
import { User } from "@/models/User";
import { AuthenticatedRequest } from "@/middleware/authMiddleware";

export const recordInteraction = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { productId, type } = req.body as {
    productId?: string;
    type?: InteractionType;
  };

  if (!userId || !productId || !type) {
    return res.status(400).json({ message: "productId and type are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid identifiers" });
  }

  await Interaction.create({ user: userId, product: productId, type });

  const addToSet: Record<string, unknown> = {};
  if (type === "view") {
    addToSet.viewedProducts = productId;
  }
  if (type === "like") {
    addToSet.likedProducts = productId;
  }
  if (type === "purchase") {
    addToSet.purchaseHistory = productId;
  }

  if (Object.keys(addToSet).length) {
    await User.findByIdAndUpdate(userId, { $addToSet: addToSet });
  }

  res.status(201).json({ message: "Interaction recorded" });
};
