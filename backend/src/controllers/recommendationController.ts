import { Request, Response } from "express";
import { getRecommendationsForUser } from "@/services/recommendationService";

export const getRecommendations = async (req: Request, res: Response) => {
  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "userId query parameter is required" });
  }

  const recommendations = await getRecommendationsForUser(userId);
  res.json({ userId, recommendations });
};
