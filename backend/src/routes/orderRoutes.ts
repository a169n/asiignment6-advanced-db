import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { createOrder, getMyOrders, updateOrder } from "@/controllers/orderController";
import { requireAuth } from "@/middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(createOrder));
router.get("/my", asyncHandler(getMyOrders));
router.patch("/:id/status", asyncHandler(updateOrder));

export default router;
