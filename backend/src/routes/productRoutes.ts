import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { getProducts, searchProductsController } from "@/controllers/productController";

const router = Router();

router.get("/", asyncHandler(getProducts));
router.get("/search", asyncHandler(searchProductsController));

export default router;
