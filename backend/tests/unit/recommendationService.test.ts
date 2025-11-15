import { describe, expect } from "vitest";
import mongoose from "mongoose";
import { getRecommendationsForUser } from "@/services/recommendationService";
import { createTestProduct, createTestUser, seedInteractions } from "../utils/fixtures";

describe("recommendationService", () => {
  it("scores candidate products based on neighbours", async () => {
    const target = await createTestUser({ username: "target", email: "target@example.com" });
    const neighbor = await createTestUser({ username: "neighbor", email: "neighbor@example.com" });
    const focus = await createTestProduct({ productName: "Focus Lens" });
    const candidate = await createTestProduct({ productName: "Camera Tripod", popularity: 20 });
    const filler = await createTestProduct({ productName: "Desk Lamp", popularity: 5 });
    // Add more products to ensure filler doesn't make it into top recommendations
    const other1 = await createTestProduct({ productName: "Product A", popularity: 10 });
    const other2 = await createTestProduct({ productName: "Product B", popularity: 15 });
    const other3 = await createTestProduct({ productName: "Product C", popularity: 12 });

    await seedInteractions({
      userId: target.user._id,
      products: [
        { product: focus, type: "like" },
        { product: focus, type: "purchase" },
      ],
    });

    await seedInteractions({
      userId: neighbor.user._id,
      products: [
        { product: focus, type: "like" },
        { product: candidate, type: "purchase" },
        { product: filler, type: "view" },
        { product: other1, type: "like" },
        { product: other2, type: "purchase" },
        { product: other3, type: "like" },
      ],
    });

    const recommendations = await getRecommendationsForUser(target.user._id.toString(), { limit: 3 });
    const names = recommendations.map((item) => item.productName);
    expect(names).toContain(candidate.productName);
    expect(names).not.toContain(filler.productName);
  });

  it("returns empty array for invalid user id", async () => {
    const result = await getRecommendationsForUser("not-a-valid-id");
    expect(result).toEqual([]);
  });

  it("returns trending products when neighbours absent", async () => {
    const user = await createTestUser({ username: "cold2", email: "cold2@example.com" });
    const trending = await createTestProduct({ productName: "Trending Bottle", popularity: 100 });
    const other = await createTestProduct({ productName: "Quiet Mug", popularity: 1 });
    const heavy = await createTestUser({ username: "heavy2", email: "heavy2@example.com" });

    await seedInteractions({
      userId: heavy.user._id,
      products: [
        { product: trending, type: "purchase" },
        { product: trending, type: "like" },
        { product: other, type: "view" },
      ],
    });

    const recommendations = await getRecommendationsForUser(user.user._id.toString(), { limit: 3 });
    const ids = recommendations.map((item) => (item._id as mongoose.Types.ObjectId).toString());
    expect(ids).toContain((trending._id as mongoose.Types.ObjectId).toString());
  });
});
