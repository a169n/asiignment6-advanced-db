import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { listUsers, updateUser } from "@/controllers/userController";

const router = Router();

router.get("/", asyncHandler(listUsers));
router.put("/:id", asyncHandler(updateUser));

export default router;
