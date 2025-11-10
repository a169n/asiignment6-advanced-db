export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  purchaseHistory: string[];
  likedProducts: string[];
  viewedProducts: string[];
}

export interface Product {
  _id: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
}

export interface InteractionPayload {
  productId: string;
  type: "view" | "like" | "purchase";
}

export interface RecommendationResponse {
  userId: string;
  recommendations: Product[];
}

export interface SearchFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}
