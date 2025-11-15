import { describe, expect } from "vitest";
import { performance } from "node:perf_hooks";
import mongoose from "mongoose";
import { request } from "../utils/testAgent";
import { testCase } from "../utils/testCase";
import { authenticateTestUser, createTestProduct } from "../utils/fixtures";
import { Interaction } from "@/models/Interaction";
import { Product } from "@/models/Product";

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("Database integrity & profiling", () => {
  testCase(
    {
      id: "DB-001",
      title: "deduplicates concurrent likes",
      functionTested: "POST /api/interactions",
      inputData: "parallel like requests",
      expectedResult: "single like persisted",
    },
    async () => {
      const { token, userId } = await authenticateTestUser({ email: "db-user@example.com", username: "db-user" });
      const product = await createTestProduct({ productName: "Integrity Jacket" });
      const agent = request();
      const start = performance.now();
      await Promise.all(
        Array.from({ length: 3 }).map(() =>
          agent
            .post("/api/interactions")
            .set(authHeaders(token))
            .send({ productId: product._id, type: "like" })
        )
      );
      const durationMs = performance.now() - start;
      const likes = await Interaction.find({
        user: new mongoose.Types.ObjectId(userId),
        product: new mongoose.Types.ObjectId(product._id.toString()),
        type: "like",
      });
      expect(likes.length).toBe(1);
      return { actualResult: `1 like retained (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "DB-002",
      title: "product text search uses index",
      functionTested: "Product.find $text explain",
      inputData: "search electronics",
      expectedResult: "IXSCAN in winning plan",
    },
    async () => {
      await createTestProduct({ productName: "Indexed Camera", category: "electronics", tags: ["camera"], price: 699 });
      await createTestProduct({ productName: "Indexed Lens", category: "electronics", tags: ["lens"], price: 399 });
      const explanation = await Product.collection
        .find({ $text: { $search: "camera" } })
        .project({ score: { $meta: "textScore" } })
        .explain("executionStats");
      const winning = explanation.queryPlanner?.winningPlan;
      const planString = JSON.stringify(winning);
      expect(planString).toMatch(/IXSCAN/);
      return { actualResult: "Text index engaged", durationMs: 0 };
    }
  );

  testCase(
    {
      id: "DB-003",
      title: "category and price filter uses compound index",
      functionTested: "Product.find explain",
      inputData: "category=electronics",
      expectedResult: "compound IXSCAN",
    },
    async () => {
      await createTestProduct({ productName: "Indexed Phone", category: "electronics", price: 299 });
      await createTestProduct({ productName: "Indexed Tablet", category: "electronics", price: 499 });
      const explanation = await Product.collection
        .find({ category: "electronics", price: { $lte: 500 } })
        .explain("executionStats");
      const winning = explanation.queryPlanner?.winningPlan;
      expect(JSON.stringify(winning)).toMatch(/IXSCAN/);
      return { actualResult: "Compound index in use", durationMs: 0 };
    }
  );
});
