import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import type {
  CreateOrderPayload,
  InteractionCollectionResponse,
  InteractionEntry,
  InteractionPayload,
  Product,
  OrderResponse,
  OrdersCollection,
  ProductQueryResponse,
  RecommendationResponse,
  SearchFilters
} from "@/types";

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
      return api.get<ProductQueryResponse>(`/api/products${query}`);
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

export function useProduct(productId: string, enabled = true) {
  return useQuery({
    queryKey: ["product", productId],
    enabled: enabled && Boolean(productId),
    queryFn: () => api.get<Product>(`/api/products/${productId}`)
  });
}

export function useTrackInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InteractionPayload) => api.post<InteractionEntry | { liked?: boolean }>("/api/interactions", payload),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["interactions"] });
      void queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    }
  });
}

export function useInteractions(userId: string, params: URLSearchParams) {
  return useQuery({
    queryKey: ["interactions", userId, params.toString()],
    queryFn: () => api.get<InteractionCollectionResponse>(`/api/users/${userId}/interactions?${params.toString()}`),
    enabled: Boolean(userId)
  });
}

export function useOrders(params: URLSearchParams) {
  return useQuery({
    queryKey: ["orders", params.toString()],
    queryFn: () => api.get<OrdersCollection>(`/api/orders/my?${params.toString()}`)
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => api.post<OrderResponse>("/api/orders", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["interactions"] });
    }
  });
}
