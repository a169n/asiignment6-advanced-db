import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { recordInteraction } from "@/controllers/interactionController";

const router = Router();

router.post("/", asyncHandler(recordInteraction));

export default router;
