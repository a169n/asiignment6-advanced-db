import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";
import type {
  InteractionPayload,
  Product,
  RecommendationResponse,
  SearchFilters,
  User
} from "@/types";

type ProductsResponse = {
  products: Product[];
  total: number;
  filters: SearchFilters;
};

export function useProducts(filters: SearchFilters) {
  return useQuery({
    queryKey: ["products", filters],
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

export function useRecommendations(userId?: string) {
  return useQuery({
    queryKey: ["recommendations", userId],
    enabled: Boolean(userId),
    queryFn: () => api.get<RecommendationResponse>(`/api/recommendations?userId=${userId}`)
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/api/users")
  });
}

export function useRegisterUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; email: string; password: string }) =>
      api.post<User>("/api/register", data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["users"] });
    }
  });
}

export function useUpdateProfile(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => {
      if (!userId) {
        throw new Error("User ID is required to update a profile");
      }
      return api.put<User>(`/api/users/${userId}`, data);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["users"] });
    }
  });
}

export function useTrackInteraction() {
  return useMutation({
    mutationFn: (payload: InteractionPayload) => api.post("/api/interactions", payload)
  });
}
