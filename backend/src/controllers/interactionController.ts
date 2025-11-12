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

  if (type === "like") {
    const existing = await Interaction.findOne({ user: userId, product: productId, type: "like" }).lean();
    if (existing) {
      await Interaction.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(userId, { $pull: { likedProducts: productId } });
      return res.status(200).json({ message: "Like removed", liked: false });
    }

    const created = await Interaction.create({ user: userId, product: productId, type: "like" });
    await User.findByIdAndUpdate(userId, { $addToSet: { likedProducts: productId } });
    return res.status(201).json({ message: "Like saved", liked: true, interactionId: created._id });
  }

  if (type === "view") {
    await Interaction.updateOne(
      { user: userId, product: productId, type: "view" },
      { $setOnInsert: { createdAt: new Date() }, $set: { user: userId, product: productId, type: "view" } },
      { upsert: true }
    );
    await User.findByIdAndUpdate(userId, { $addToSet: { viewedProducts: productId } });
    return res.status(200).json({ message: "View recorded" });
  }

  if (type === "purchase") {
    const interaction = await Interaction.create({ user: userId, product: productId, type: "purchase" });
    await User.findByIdAndUpdate(userId, { $addToSet: { purchaseHistory: productId } });
    return res.status(201).json({ message: "Purchase recorded", interactionId: interaction._id });
  }

  return res.status(400).json({ message: "Unsupported interaction type" });
};
