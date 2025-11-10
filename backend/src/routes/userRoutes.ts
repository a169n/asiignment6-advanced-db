import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getCurrentUser, listUsers, updateUser } from "@/controllers/userController";
import { requireAuth } from "@/middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listUsers));
router.get("/me", asyncHandler(getCurrentUser));
router.put("/:id", asyncHandler(updateUser));

export default router;
