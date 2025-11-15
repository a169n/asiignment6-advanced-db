import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Product, type IProduct } from "@/models/Product";
import { User, type IUser } from "@/models/User";
import { Interaction } from "@/models/Interaction";
import { request } from "./testAgent";

export const defaultPassword = "Password123!";

export async function createTestUser(overrides: Partial<IUser> = {}) {
  const password = overrides.password ? String(overrides.password) : defaultPassword;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: overrides.username || `user_${Date.now()}`,
    email: overrides.email || `user_${Date.now()}@example.com`,
    password: hashed,
    bio: overrides.bio,
    likedProducts: overrides.likedProducts || [],
    purchaseHistory: overrides.purchaseHistory || [],
    viewedProducts: overrides.viewedProducts || [],
    role: overrides.role || "user",
    notificationPreferences: overrides.notificationPreferences,
  });
  return { user, password };
}

export async function createTestProduct(overrides: Partial<IProduct> = {}) {
  const product = await Product.create({
    productName: overrides.productName || `Product ${Date.now()}`,
    description: overrides.description || "A versatile item for testing.",
    category: overrides.category || "testing",
    price: overrides.price ?? 49.99,
    tags: overrides.tags || ["test", "automation"],
    imageUrl: overrides.imageUrl || "https://example.com/product.jpg",
    imageAlt: overrides.imageAlt || "Test product",
    rating: overrides.rating ?? 4.5,
    popularity: overrides.popularity ?? 10,
  });
  return product;
}

export async function createInteraction(params: {
  userId: mongoose.Types.ObjectId | string;
  productId: mongoose.Types.ObjectId | string;
  type: "view" | "like" | "purchase";
}) {
  const { userId, productId, type } = params;
  return Interaction.create({
    user: new mongoose.Types.ObjectId(userId),
    product: new mongoose.Types.ObjectId(productId),
    type,
  });
}

export async function authenticateTestUser(options: { email?: string; username?: string; password?: string } = {}) {
  const agent = request();
  const email = options.email || `auth_${Date.now()}@example.com`;
  const username = options.username || `auth_user_${Date.now()}`;
  const password = options.password || defaultPassword;
  await agent.post("/api/register").send({ username, email, password });
  const loginResponse = await agent.post("/api/login").send({ email, password });
  const token = loginResponse.body.token as string;
  const userId = loginResponse.body.user._id as string;
  return { token, userId, credentials: { email, password } };
}

export async function seedProducts(quantity: number) {
  const products: IProduct[] = [];
  for (let index = 0; index < quantity; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    const product = await createTestProduct({
      productName: `Seed Product ${index + 1}`,
      price: 10 + index,
      category: index % 2 === 0 ? "apparel" : "electronics",
      tags: index % 2 === 0 ? ["clothing", "casual"] : ["gadget", "tech"],
      popularity: 5 + index,
    });
    products.push(product);
  }
  return products;
}

export async function seedInteractions({
  userId,
  products,
}: {
  userId: mongoose.Types.ObjectId | string;
  products: Array<{ product: IProduct; type: "view" | "like" | "purchase" }>; }) {
  for (const entry of products) {
    // eslint-disable-next-line no-await-in-loop
    await createInteraction({
      userId,
      productId: entry.product._id,
      type: entry.type,
    });
  }
}
