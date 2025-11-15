import { describe, expect } from "vitest";
import { performance } from "node:perf_hooks";
import mongoose from "mongoose";
import { request } from "../utils/testAgent";
import { testCase } from "../utils/testCase";
import {
  authenticateTestUser,
  createInteraction,
  createTestProduct,
  createTestUser,
  seedInteractions,
} from "../utils/fixtures";

describe("Recommendation engine", () => {
  testCase(
    {
      id: "RECO-001",
      title: "returns collaborative recommendations",
      functionTested: "GET /api/recommendations",
      inputData: "user with likes/purchases",
      expectedResult: "200 OK with recommendations",
    },
    async () => {
      const { token, userId } = await authenticateTestUser();
      const focusProduct = await createTestProduct({ productName: "Trail Shoes", tags: ["shoes", "outdoor"] });
      const similarProduct = await createTestProduct({ productName: "Trail Socks", tags: ["socks", "outdoor"], popularity: 50 });
      const filler = await createTestProduct({ productName: "City Jacket", tags: ["apparel"], popularity: 5 });

      await createInteraction({ userId, productId: focusProduct._id, type: "like" });
      await createInteraction({ userId, productId: focusProduct._id, type: "purchase" });

      const { user: neighbor } = await createTestUser({ username: "neighbor", email: "neighbor@example.com" });
      await seedInteractions({
        userId: neighbor._id,
        products: [
          { product: focusProduct, type: "like" },
          { product: similarProduct, type: "purchase" },
          { product: filler, type: "view" },
        ],
      });

      const agent = request();
      const start = performance.now();
      const response = await agent
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${token}`);
      const durationMs = performance.now() - start;
      expect(response.status).toBe(200);
      const names = (response.body.recommendations as Array<{ productName: string }>).map((item) => item.productName);
      expect(names).toContain(similarProduct.productName);
      return { actualResult: `200 recommendations (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "RECO-002",
      title: "falls back to trending when no interactions",
      functionTested: "GET /api/recommendations",
      inputData: "new user",
      expectedResult: "200 OK fallback",
    },
    async () => {
      const { token } = await authenticateTestUser({ email: "cold@example.com", username: "cold" });
      const trending = await createTestProduct({ productName: "Trending Hoodie", popularity: 99 });
      const other = await createTestProduct({ productName: "Quiet Socks", popularity: 1 });
      const richUser = await createTestUser({ username: "heavy", email: "heavy@example.com" });
      await seedInteractions({
        userId: richUser.user._id,
        products: [
          { product: trending, type: "purchase" },
          { product: trending, type: "like" },
          { product: other, type: "view" },
        ],
      });
      const agent = request();
      const start = performance.now();
      const response = await agent
        .get("/api/recommendations")
        .set("Authorization", `Bearer ${token}`);
      const durationMs = performance.now() - start;
      expect(response.status).toBe(200);
      const ids = (response.body.recommendations as Array<{ _id: string }>).map((item) => item._id);
      expect(ids).toContain((trending._id as mongoose.Types.ObjectId).toString());
      return { actualResult: `200 trending fallback (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );
});
