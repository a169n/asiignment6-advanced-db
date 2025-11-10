import { Request, Response } from "express";
import { findProducts, searchProducts } from "@/services/productService";

function parseNumber(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const getProducts = async (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice } = req.query;
  const filters = {
    q: typeof q === "string" ? q : undefined,
    category: typeof category === "string" ? category : undefined,
    minPrice: parseNumber(typeof minPrice === "string" ? minPrice : undefined),
    maxPrice: parseNumber(typeof maxPrice === "string" ? maxPrice : undefined)
  };
  const result = await findProducts(filters);
  res.json(result);
};

export const searchProductsController = async (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice } = req.query;
  const filters = {
    q: typeof q === "string" ? q : undefined,
    category: typeof category === "string" ? category : undefined,
    minPrice: parseNumber(typeof minPrice === "string" ? minPrice : undefined),
    maxPrice: parseNumber(typeof maxPrice === "string" ? maxPrice : undefined)
  };
  const result = await searchProducts(filters);
  res.json(result);
};
