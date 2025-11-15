import mongoose from "mongoose";
import { seedDatabase } from "@/utils/seedData";
import { appConfig } from "@/config/appConfig";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/advanced-db-commerce";

export async function connectDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error", error);
  });

  await mongoose.connect(uri, {
    maxPoolSize: 10
  });

  await mongoose.connection.db?.collection("products")?.createIndex({
    productName: "text",
    description: "text",
    category: "text",
    tags: "text"
  });

  await mongoose.connection.db?.collection("products")?.createIndex({
    category: 1,
    price: 1
  });

  await mongoose.connection.db?.collection("interactions")?.createIndex({
    user: 1,
    product: 1,
    type: 1,
    createdAt: -1
  });

  await mongoose.connection.db?.collection("orders")?.createIndex({
    user: 1,
    createdAt: -1
  });

  // Ensure unique indexes for users are created
  await mongoose.connection.db?.collection("users")?.createIndex({ username: 1 }, { unique: true });
  await mongoose.connection.db?.collection("users")?.createIndex({ email: 1 }, { unique: true });

  if (appConfig.autoSeed) {
    await seedDatabase();
  }

  return mongoose.connection;
}
