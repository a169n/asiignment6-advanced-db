import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getProducts, searchProductsController } from "@/controllers/productController";
import { requireAuth } from "@/middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getProducts));
router.get("/search", asyncHandler(searchProductsController));

export default router;
