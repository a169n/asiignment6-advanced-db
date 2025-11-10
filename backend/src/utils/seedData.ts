import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Interaction, type InteractionType } from "@/models/Interaction";

const defaultProducts = [
  {
    productName: "Aurora Noise-Cancelling Headphones",
    description: "Wireless over-ear headphones with adaptive noise cancellation and 30-hour battery life.",
    category: "Electronics",
    price: 199.99,
    tags: ["audio", "wireless", "premium"],
  },
  {
    productName: "Summit Trail Running Shoes",
    description: "Lightweight trail runners designed for stability on uneven surfaces and wet conditions.",
    category: "Outdoors",
    price: 149.0,
    tags: ["footwear", "athletic", "water-resistant"],
  },
  {
    productName: "Harbor Pour-Over Coffee Maker",
    description: "Glass pour-over coffee maker with reusable stainless-steel filter for rich flavor extraction.",
    category: "Home",
    price: 59.5,
    tags: ["kitchen", "coffee", "eco-friendly"],
  },
  {
    productName: "Cascade Smart Water Bottle",
    description: "Insulated bottle that tracks hydration levels and syncs with your smartphone.",
    category: "Wellness",
    price: 89.99,
    tags: ["hydration", "smart", "health"],
  },
  {
    productName: "Lumen Desk Lamp",
    description: "Adjustable LED desk lamp with ambient light sensor and wireless charging pad.",
    category: "Office",
    price: 129.99,
    tags: ["lighting", "smart", "workspace"],
  },
];

const defaultUsers = [
  {
    username: "ava",
    email: "ava@example.com",
    password: "Password123!",
    bio: "Product designer exploring the latest in smart home tech.",
    likedProducts: [0, 3, 4],
    purchaseHistory: [0, 2],
  },
  {
    username: "marco",
    email: "marco@example.com",
    password: "Password123!",
    bio: "Runner and coffee enthusiast always searching for performance gear.",
    likedProducts: [1, 2],
    purchaseHistory: [1],
  },
  {
    username: "tanya",
    email: "tanya@example.com",
    password: "Password123!",
    bio: "Operations manager keeping the workspace modern and comfortable.",
    likedProducts: [3, 4],
    purchaseHistory: [4],
  },
];

async function seedProducts(): Promise<string[]> {
  const count = await Product.countDocuments();
  if (count > 0) {
    const existing = await Product.find({}, { _id: 1 }).lean();
    return existing.map((product) => product._id.toString());
  }

  const inserted = await Product.insertMany(defaultProducts);
  return inserted.map((product) => (product._id as mongoose.Types.ObjectId).toString());
}

interface SeededUserSummary {
  _id: string;
  likedProducts: string[];
  purchaseHistory: string[];
}

async function seedUsers(productIds: string[]): Promise<SeededUserSummary[]> {
  const count = await User.countDocuments();
  if (count > 0) {
    const existing = await User.find({}, { likedProducts: 1, purchaseHistory: 1 })
      .lean()
      .exec();
    return existing.map((user) => ({
      _id: user._id.toString(),
      likedProducts: (user.likedProducts ?? []).map((product) => product.toString()),
      purchaseHistory: (user.purchaseHistory ?? []).map((product) => product.toString()),
    }));
  }

  const payload = await Promise.all(
    defaultUsers.map(async (user) => {
      const hashed = await bcrypt.hash(user.password, 10);
      return {
        username: user.username,
        email: user.email,
        password: hashed,
        bio: user.bio,
        likedProducts: user.likedProducts.map((index) => productIds[index]).filter(Boolean),
        purchaseHistory: user.purchaseHistory.map((index) => productIds[index]).filter(Boolean),
        viewedProducts: [] as string[],
      };
    })
  );

  const inserted = await User.insertMany(payload);
  return inserted.map((user) => ({
    _id: (user._id as mongoose.Types.ObjectId).toString(),
    likedProducts: user.likedProducts.map((product) => product.toString()),
    purchaseHistory: user.purchaseHistory.map((product) => product.toString()),
  }));
}

async function seedInteractions(users: SeededUserSummary[]) {
  const count = await Interaction.countDocuments();
  if (count > 0) {
    return;
  }

  const interactions: Array<{ user: string; product: string; type: InteractionType }> = [];
  users.forEach((user) => {
    const liked = user.likedProducts ?? [];
    const purchased = user.purchaseHistory ?? [];
    liked.forEach((product) => interactions.push({ user: user._id, product, type: "like" }));
    purchased.forEach((product) => interactions.push({ user: user._id, product, type: "purchase" }));
  });

  if (interactions.length) {
    await Interaction.insertMany(interactions, { ordered: false });
  }
}

export async function seedDatabase() {
  const productIds = await seedProducts();
  const users = await seedUsers(productIds);
  await seedInteractions(users);
}
