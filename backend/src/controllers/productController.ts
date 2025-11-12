import { Response } from "express";
import { findProductById, findProducts, searchProducts } from "@/services/productService";
import { AuthenticatedRequest } from "@/middleware/authMiddleware";

function parseNumber(value?: string | string[] | null) {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStringArray(value?: string | string[]) {
  if (!value) return undefined;
  const values = Array.isArray(value) ? value : value.split(",");
  const normalized = values.map((entry) => entry.trim()).filter(Boolean);
  return normalized.length ? normalized : undefined;
}

function parseFilters(query: Record<string, unknown>) {
  const { q, category, minPrice, maxPrice, page, limit, tags, sort } = query;
  return {
    q: typeof q === "string" ? q : undefined,
    category: typeof category === "string" ? category : undefined,
    minPrice: parseNumber(minPrice as string | string[] | undefined),
    maxPrice: parseNumber(maxPrice as string | string[] | undefined),
    page: parseNumber(page as string | string[] | undefined),
    limit: parseNumber(limit as string | string[] | undefined),
    tags: parseStringArray(tags as string | string[] | undefined),
    sort: typeof sort === "string" ? (sort as any) : undefined
  };
}

export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  const filters = parseFilters(req.query as Record<string, unknown>);
  const result = await findProducts(filters);
  res.json(result);
};

export const searchProductsController = async (req: AuthenticatedRequest, res: Response) => {
  const filters = parseFilters(req.query as Record<string, unknown>);
  const result = await searchProducts(filters);
  res.json(result);
};

export const getProductById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params as { id?: string };
  if (!id) {
    return res.status(400).json({ message: "Product id is required" });
  }

  const product = await findProductById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};
