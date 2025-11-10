"use client";

import { ProductCard } from "@/components/product-card";
import type { Product } from "@/types";

interface ProductRecommendationsProps {
  recommendations: Product[];
  isLoading: boolean;
  errorMessage?: string;
}

export function ProductRecommendations({ recommendations, isLoading, errorMessage }: ProductRecommendationsProps) {
  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading your recommendations...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-red-400">{errorMessage}</p>;
  }

  if (!recommendations.length) {
    return <p className="text-sm text-slate-400">We will show recommendations once you interact with products.</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Recommended for you</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
