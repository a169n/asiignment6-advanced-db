import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import type { InteractionPayload, Product, RecommendationResponse, SearchFilters } from "@/types";

type ProductsResponse = {
  products: Product[];
  total: number;
  filters: SearchFilters;
};

export function useProducts(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: ["products", filters],
    enabled,
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.q) params.append("q", filters.q);
      if (filters.category) params.append("category", filters.category);
      if (typeof filters.minPrice === "number") params.append("minPrice", filters.minPrice.toString());
      if (typeof filters.maxPrice === "number") params.append("maxPrice", filters.maxPrice.toString());
      const query = params.size ? `?${params.toString()}` : "";
      return api.get<ProductsResponse>(`/api/products${query}`);
    }
  });
}

export function useRecommendations(enabled: boolean) {
  return useQuery({
    queryKey: ["recommendations"],
    enabled,
    queryFn: () => api.get<RecommendationResponse>("/api/recommendations")
  });
}

export function useTrackInteraction() {
  return useMutation({
    mutationFn: (payload: InteractionPayload) => api.post("/api/interactions", payload)
  });
}
