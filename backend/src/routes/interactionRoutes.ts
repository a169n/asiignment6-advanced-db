import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { recordInteraction } from "@/controllers/interactionController";
import { requireAuth } from "@/middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(recordInteraction));

export default router;
