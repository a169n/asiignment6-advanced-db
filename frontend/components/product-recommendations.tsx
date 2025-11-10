"use client";

import { useRecommendations } from "@/hooks/use-products";
import { ProductCard } from "@/components/product-card";

interface ProductRecommendationsProps {
  userId?: string;
}

export function ProductRecommendations({ userId }: ProductRecommendationsProps) {
  const { data, isFetching } = useRecommendations(userId);

  if (!userId) {
    return <p className="text-sm text-slate-400">Log in to see personalized recommendations.</p>;
  }

  if (isFetching) {
    return <p className="text-sm text-slate-400">Loading your recommendations...</p>;
  }

  if (!data?.recommendations.length) {
    return <p className="text-sm text-slate-400">We will show recommendations once you interact with products.</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">Recommended for you</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.recommendations.map((product) => (
          <ProductCard key={product._id} product={product} userId={userId} />
        ))}
      </div>
    </section>
  );
}
