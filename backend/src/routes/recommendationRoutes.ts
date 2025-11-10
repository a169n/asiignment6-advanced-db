import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getRecommendations } from "@/controllers/recommendationController";
import { requireAuth } from "@/middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getRecommendations));

export default router;
