"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/product-card";
import { SearchFilters } from "@/components/search-filters";
import { ProductRecommendations } from "@/components/product-recommendations";

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function ProductsView() {
  const params = useSearchParams();
  const filters = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      category: params.get("category") ?? undefined,
      minPrice: parseNumber(params.get("minPrice")),
      maxPrice: parseNumber(params.get("maxPrice"))
    }),
    [params]
  );
  const { data, isLoading } = useProducts(filters);
  const products = data?.products ?? [];
  const userId = params.get("userId") ?? undefined;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Product catalog</h1>
        <p className="text-slate-400">Search and explore the latest additions to the marketplace.</p>
        <SearchFilters categories={products.map((product) => product.category)} />
      </section>

      {isLoading ? (
        <p>Loading products...</p>
      ) : products.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} userId={userId} />
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No products found for your search.</p>
      )}

      <ProductRecommendations userId={userId} />
    </div>
  );
}
