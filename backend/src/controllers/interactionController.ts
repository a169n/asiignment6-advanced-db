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
    // Check if like already exists
    const existing = await Interaction.findOne({ user: userId, product: productId, type: "like" }).lean();
    
    if (existing) {
      // Like exists, remove it (toggle off)
      await Interaction.deleteOne({ _id: existing._id });
      await User.findByIdAndUpdate(userId, { $pull: { likedProducts: productId } });
      return res.status(200).json({ message: "Like removed", liked: false });
    }

    // Like doesn't exist, create it atomically using findOneAndUpdate with upsert
    // This prevents race conditions when multiple parallel requests try to create the same like
    try {
      const result = await Interaction.findOneAndUpdate(
        { user: userId, product: productId, type: "like" },
        { $setOnInsert: { user: userId, product: productId, type: "like", createdAt: new Date() } },
        { upsert: true, new: true, lean: true }
      );
      
      await User.findByIdAndUpdate(userId, { $addToSet: { likedProducts: productId } });
      return res.status(201).json({ message: "Like saved", liked: true, interactionId: result._id });
    } catch (error: any) {
      // Handle duplicate key error from unique index (race condition protection)
      if (error.code === 11000) {
        // Another request created the like between our check and create
        // This is expected in parallel requests - the like was successfully created by another request
        // Return success since the like now exists
        const created = await Interaction.findOne({ user: userId, product: productId, type: "like" }).lean();
        if (created) {
          await User.findByIdAndUpdate(userId, { $addToSet: { likedProducts: productId } });
          return res.status(201).json({ message: "Like saved", liked: true, interactionId: created._id });
        }
      }
      throw error;
    }
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
