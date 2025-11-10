import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "@/models/User";

export const listUsers = async (_req: Request, res: Response) => {
  const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
  res.json(users);
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const { bio, likedProducts, purchaseHistory } = req.body as {
    bio?: string;
    likedProducts?: string[];
    purchaseHistory?: string[];
  };

  const updatePayload: Record<string, unknown> = {};
  if (typeof bio === "string") updatePayload.bio = bio;
  if (Array.isArray(likedProducts)) updatePayload.likedProducts = likedProducts;
  if (Array.isArray(purchaseHistory)) updatePayload.purchaseHistory = purchaseHistory;

  const updated = await User.findByIdAndUpdate(id, updatePayload, { new: true }).lean();

  if (!updated) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(updated);
};
