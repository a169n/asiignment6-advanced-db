"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts, useRecommendations } from "@/hooks/use-products";
import { ProductCard } from "@/components/product-card";
import { SearchFilters } from "@/components/search-filters";
import { ProductRecommendations } from "@/components/product-recommendations";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function ProductsView() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  const filters = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      category: params.get("category") ?? undefined,
      minPrice: parseNumber(params.get("minPrice")),
      maxPrice: parseNumber(params.get("maxPrice")),
      page: parseNumber(params.get("page")),
      sort: params.get("sort") ?? undefined
    }),
    [params]
  );
  const { data, isLoading, isError, error } = useProducts(filters, !authLoading && Boolean(user));
  const products = data?.products ?? [];
  const pagination = data?.pagination;
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).sort(), [products]);
  const {
    data: recommendationsData,
    isFetching: isFetchingRecommendations,
    isError: isRecommendationsError,
    error: recommendationsError,
  } = useRecommendations(Boolean(user) && !authLoading);
  const recommendations = recommendationsData?.recommendations ?? [];
  const recommendationsErrorMessage =
    isRecommendationsError && recommendationsError instanceof Error
      ? recommendationsError.message
      : null;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Product catalog</h1>
        <p className="text-slate-400">Search and explore the latest additions to the marketplace.</p>
        <SearchFilters categories={categories} pagination={pagination} />
      </section>

      {authLoading || isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-xl bg-slate-800/60" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-400">{error instanceof Error ? error.message : "Failed to load products"}</p>
      ) : products.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No products found for your search.</p>
      )}

      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => {
              const nextParams = new URLSearchParams(params.toString());
              nextParams.set("page", String(Math.max(1, (pagination.page ?? 1) - 1)));
              router.push(`/?${nextParams.toString()}`);
            }}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <p className="text-sm text-slate-300">
            Page {pagination.page} of {pagination.pageCount}
          </p>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.pageCount}
            onClick={() => {
              const nextParams = new URLSearchParams(params.toString());
              nextParams.set("page", String(Math.min(pagination.pageCount, pagination.page + 1)));
              router.push(`/?${nextParams.toString()}`);
            }}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      )}

      <ProductRecommendations
        isLoading={authLoading || isFetchingRecommendations}
        recommendations={recommendations}
        errorMessage={recommendationsErrorMessage ?? undefined}
      />
    </div>
  );
}
