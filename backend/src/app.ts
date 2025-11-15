import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "@/routes/authRoutes";
import productRoutes from "@/routes/productRoutes";
import userRoutes from "@/routes/userRoutes";
import interactionRoutes from "@/routes/interactionRoutes";
import recommendationRoutes from "@/routes/recommendationRoutes";
import orderRoutes from "@/routes/orderRoutes";
import { errorHandler } from "@/utils/errorHandler";

export interface CreateAppOptions {
  loggingFormat?: string;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const loggingFormat = options.loggingFormat ?? "dev";

  app.use(cors());
  app.use(express.json());
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(morgan(loggingFormat));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/interactions", interactionRoutes);
  app.use("/api/recommendations", recommendationRoutes);
  app.use("/api/orders", orderRoutes);

  app.use(errorHandler);

  return app;
}
