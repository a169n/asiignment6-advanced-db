import type { PipelineStage } from "mongoose";
import { Product } from "@/models/Product";
import { appConfig } from "@/config/appConfig";

export type ProductSort = "relevance" | "priceAsc" | "priceDesc" | "rating" | "popularity" | "newest";

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: ProductSort;
}

export async function findProducts(filters: ProductFilters) {
  const { q, category, minPrice, maxPrice, tags, page, limit, sort } = filters;
  const pipeline: PipelineStage[] = [];

  // $text search must be in its own $match stage and cannot be combined with other fields
  if (q) {
    pipeline.push({ $match: { $text: { $search: q } } });
  }

  // Additional filters go in a separate $match stage
  const additionalMatch: Record<string, any> = {};
  if (category) {
    additionalMatch.category = category;
  }

  if (typeof minPrice === "number" || typeof maxPrice === "number") {
    additionalMatch.price = {};
    if (typeof minPrice === "number") {
      (additionalMatch.price as Record<string, number>).$gte = minPrice;
    }
    if (typeof maxPrice === "number") {
      (additionalMatch.price as Record<string, number>).$lte = maxPrice;
    }
  }

  if (tags?.length) {
    additionalMatch.tags = { $all: tags };
  }

  if (Object.keys(additionalMatch).length > 0) {
    pipeline.push({ $match: additionalMatch });
  }

  const sortMode: ProductSort = sort || (q ? "relevance" : "newest");

  if (q) {
    pipeline.push({
      $addFields: {
        relevanceScore: { $meta: "textScore" }
      }
    });
  }

  type SortMeta = 1 | -1 | { $meta: "textScore" };
  const sortStage: Record<string, SortMeta> = {};
  switch (sortMode) {
    case "priceAsc":
      sortStage.price = 1;
      break;
    case "priceDesc":
      sortStage.price = -1;
      break;
    case "rating":
      sortStage.rating = -1;
      sortStage.popularity = -1;
      break;
    case "popularity":
      sortStage.popularity = -1;
      sortStage.rating = -1;
      break;
    case "relevance":
      if (q) {
        sortStage.relevanceScore = { $meta: "textScore" };
      } else {
        sortStage.createdAt = -1;
      }
      break;
    default:
      sortStage.createdAt = -1;
  }

  pipeline.push({
    $sort: sortStage
  });

  const pageNumber = Math.max(1, Math.floor(page ?? 1));
  const limitNumber = Math.min(appConfig.maxPageSize, Math.max(1, Math.floor(limit ?? appConfig.defaultPageSize)));
  const skip = (pageNumber - 1) * limitNumber;

  pipeline.push({
    $facet: {
      results: [
        { $skip: skip },
        { $limit: limitNumber },
        {
          $project: {
            productName: 1,
            description: 1,
            category: 1,
            price: 1,
            tags: 1,
            imageUrl: 1,
            imageAlt: 1,
            rating: 1,
            popularity: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ],
      totalCount: [
        { $count: "count" }
      ]
    }
  });

  const [result] = await Product.aggregate(pipeline);
  const products = result?.results ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

  return {
    products,
    total,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      pageCount: limitNumber > 0 ? Math.ceil(total / limitNumber) : 0
    },
    filters
  };
}

export async function searchProducts(filters: ProductFilters) {
  return findProducts(filters);
}

export async function findProductById(id: string) {
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return null;
  }

  const product = await Product.findById(id)
    .select("productName description category price tags imageUrl imageAlt rating popularity createdAt updatedAt")
    .lean();

  return product ?? null;
}
