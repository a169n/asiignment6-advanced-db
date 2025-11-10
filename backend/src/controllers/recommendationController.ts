import { Response } from "express";
import { getRecommendationsForUser } from "@/services/recommendationService";
import { AuthenticatedRequest } from "@/middleware/authMiddleware";

export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const recommendations = await getRecommendationsForUser(userId);
  res.json({ userId, recommendations });
};
