import { readFile } from "fs/promises";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Interaction, type InteractionType } from "@/models/Interaction";
import { appConfig } from "@/config/appConfig";

interface ProductSeed {
  productName: string;
  description: string;
  category: string;
  price: number;
  tags?: string[];
  imageUrl: string;
  imageAlt?: string;
  rating?: number;
  popularity?: number;
}

interface UserSeed {
  username: string;
  email: string;
  password: string;
  bio?: string;
  role?: "user" | "admin";
  likedProducts?: number[];
  purchaseHistory?: number[];
  viewedProducts?: number[];
  notificationPreferences?: {
    productAlerts?: boolean;
    orderUpdates?: boolean;
  };
}

async function loadSeedFile<T>(filename: string): Promise<T> {
  const fileUrl = new URL(`../../seed/${filename}`, import.meta.url);
  const buffer = await readFile(fileUrl, "utf-8");
  return JSON.parse(buffer) as T;
}

async function seedProducts(): Promise<mongoose.Types.ObjectId[]> {
  const products = await loadSeedFile<ProductSeed[]>("products.json");
  const ids: mongoose.Types.ObjectId[] = [];

  for (const product of products) {
    const upserted = await Product.findOneAndUpdate(
      { productName: product.productName },
      {
        ...product,
        imageAlt: product.imageAlt || appConfig.defaultImageAlt
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    ids.push(upserted._id as mongoose.Types.ObjectId);
  }

  return ids;
}

interface SeededUserSummary {
  _id: mongoose.Types.ObjectId;
  likedProducts: mongoose.Types.ObjectId[];
  purchaseHistory: mongoose.Types.ObjectId[];
}

async function seedUsers(productIds: mongoose.Types.ObjectId[]): Promise<SeededUserSummary[]> {
  const users = await loadSeedFile<UserSeed[]>("users.json");
  const summaries: SeededUserSummary[] = [];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const liked = (user.likedProducts ?? []).map((index) => productIds[index]).filter(Boolean);
    const purchased = (user.purchaseHistory ?? []).map((index) => productIds[index]).filter(Boolean);
    const viewed = (user.viewedProducts ?? []).map((index) => productIds[index]).filter(Boolean);

    const upserted = await User.findOneAndUpdate(
      { email: user.email },
      {
        username: user.username,
        email: user.email,
        password: hashedPassword,
        bio: user.bio,
        role: user.role ?? "user",
        likedProducts: liked,
        purchaseHistory: purchased,
        viewedProducts: viewed,
        notificationPreferences: {
          productAlerts: user.notificationPreferences?.productAlerts ?? true,
          orderUpdates: user.notificationPreferences?.orderUpdates ?? true
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    summaries.push({
      _id: upserted._id as mongoose.Types.ObjectId,
      likedProducts: liked,
      purchaseHistory: purchased
    });
  }

  return summaries;
}

async function seedInteractions(users: SeededUserSummary[]) {
  const existing = await Interaction.countDocuments();
  if (existing > 0) {
    return;
  }

  const interactions: Array<{ user: mongoose.Types.ObjectId; product: mongoose.Types.ObjectId; type: InteractionType }> = [];

  for (const user of users) {
    for (const product of user.likedProducts) {
      interactions.push({ user: user._id, product, type: "like" });
    }
    for (const product of user.purchaseHistory) {
      interactions.push({ user: user._id, product, type: "purchase" });
    }
  }

  if (interactions.length > 0) {
    await Interaction.insertMany(interactions, { ordered: false });
  }
}

export async function seedDatabase() {
  const productIds = await seedProducts();
  const users = await seedUsers(productIds);
  await seedInteractions(users);
}
