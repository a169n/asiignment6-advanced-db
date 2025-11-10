import { FilterQuery } from "mongoose";
import { Product, type IProduct } from "@/models/Product";

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function findProducts(filters: ProductFilters) {
  const query: FilterQuery<IProduct> = {};
  const { q, category, minPrice, maxPrice } = filters;

  if (q) {
    query.$text = { $search: q };
  }

  if (category) {
    query.category = category;
  }

  if (typeof minPrice === "number" || typeof maxPrice === "number") {
    query.price = {} as any;
    if (typeof minPrice === "number") {
      query.price.$gte = minPrice;
    }
    if (typeof maxPrice === "number") {
      query.price.$lte = maxPrice;
    }
  }

  const products = await Product.find(query).sort({ createdAt: -1 }).lean();
  return { products, total: products.length, filters };
}

export async function searchProducts(filters: ProductFilters) {
  return findProducts(filters);
}
