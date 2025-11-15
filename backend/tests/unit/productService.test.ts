import { describe, expect, beforeEach } from "vitest";
import { findProducts, searchProducts } from "@/services/productService";
import { createTestProduct } from "../utils/fixtures";

describe("productService", () => {
  beforeEach(async () => {
    // ensure clean state handled by global beforeEach
  });

  it("supports text search and sorting", async () => {
    await createTestProduct({
      productName: "Mountain Bike",
      description: "A bike for mountains",
      category: "sports",
      tags: ["bike"],
      rating: 4.7,
      popularity: 12,
    });
    await createTestProduct({
      productName: "City Bike",
      description: "Urban commuting bike",
      category: "sports",
      tags: ["bike", "city"],
      rating: 4.2,
      popularity: 8,
    });
    await createTestProduct({
      productName: "Trail Backpack",
      description: "Durable backpack",
      category: "outdoor",
      tags: ["bag"],
      rating: 4.9,
      popularity: 15,
    });

    const result = await searchProducts({ q: "bike", sort: "relevance", limit: 5 });
    expect(result.products.length).toBe(2);
    expect(result.products[0].productName).toMatch(/bike/i);
    expect(result.total).toBe(2);
  });

  it("filters by price range and category", async () => {
    await createTestProduct({ productName: "Budget Phone", category: "electronics", price: 199 });
    await createTestProduct({ productName: "Premium Phone", category: "electronics", price: 999 });
    await createTestProduct({ productName: "Headphones", category: "electronics", price: 149 });

    const result = await findProducts({
      category: "electronics",
      minPrice: 150,
      maxPrice: 500,
      sort: "priceAsc",
    });
    expect(result.products.length).toBe(1);
    expect(result.products[0].productName).toBe("Budget Phone");
    expect(result.total).toBe(1);
  });
});
