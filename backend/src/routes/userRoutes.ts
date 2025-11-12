import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getCurrentUser, getUserInteractions, listUsers, updateUser } from "@/controllers/userController";
import { requireAuth } from "@/middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listUsers));
router.get("/me", asyncHandler(getCurrentUser));
router.put("/:id", asyncHandler(updateUser));
router.get("/:id/interactions", asyncHandler(getUserInteractions));

export default router;
