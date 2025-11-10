import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getRecommendations } from "@/controllers/recommendationController";

const router = Router();

router.get("/", asyncHandler(getRecommendations));

export default router;
