export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  purchaseHistory: string[];
  likedProducts: string[];
  viewedProducts: string[];
  role?: "user" | "admin";
  notificationPreferences?: {
    productAlerts?: boolean;
    orderUpdates?: boolean;
  };
}

export interface Product {
  _id: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  imageUrl: string;
  imageAlt?: string;
  rating?: number;
  popularity?: number;
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
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: "relevance" | "priceAsc" | "priceDesc" | "rating" | "popularity" | "newest";
}

export interface Pagination {
  page: number;
  limit: number;
  pageCount: number;
}

export interface ProductQueryResponse {
  products: Product[];
  total: number;
  pagination: Pagination;
  filters: SearchFilters;
}

export interface InteractionEntry {
  _id: string;
  type: "view" | "like" | "purchase";
  createdAt: string;
  product: Product;
}

export interface InteractionCollectionResponse {
  interactions: InteractionEntry[];
  total: number;
  pagination: Pagination;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  quantity: number;
  category?: string;
}

export type OrderStatus = "PLACED" | "PAID" | "FULFILLED";

export interface OrderResponse {
  _id: string;
  user: string;
  items: OrderItemSnapshot[];
  total: number;
  status: OrderStatus;
  shippingAddress?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersCollection {
  orders: OrderResponse[];
  total: number;
  pagination: Pagination;
}

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress?: string;
  contactEmail?: string;
}
