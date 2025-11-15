import { describe, expect } from "vitest";
import { performance } from "node:perf_hooks";
import mongoose from "mongoose";
import { request } from "../utils/testAgent";
import { testCase } from "../utils/testCase";
import { authenticateTestUser, createTestProduct, seedProducts } from "../utils/fixtures";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe("Product catalogue", () => {
  testCase(
    {
      id: "PROD-001",
      title: "lists paginated products",
      functionTested: "GET /api/products",
      inputData: "default pagination",
      expectedResult: "200 OK with items",
    },
    async () => {
      const { token } = await authenticateTestUser();
      await seedProducts(5);
      const agent = request();
      const start = performance.now();
      const response = await agent.get("/api/products").set(authHeader(token));
      const durationMs = performance.now() - start;
      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(5);
      expect(response.body.pagination.total).toBe(5);
      return { actualResult: `200 list (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "PROD-002",
      title: "filters by search term and category",
      functionTested: "GET /api/products/search",
      inputData: "q=gadget&category=electronics",
      expectedResult: "200 OK filtered",
    },
    async () => {
      const { token } = await authenticateTestUser();
      await createTestProduct({ productName: "Blue Jacket", category: "apparel", tags: ["clothing"], price: 120 });
      await createTestProduct({ productName: "Smart Watch", category: "electronics", tags: ["gadget"], price: 199 });
      const agent = request();
      const start = performance.now();
      const response = await agent
        .get("/api/products/search")
        .query({ q: "watch", category: "electronics" })
        .set(authHeader(token));
      const durationMs = performance.now() - start;
      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].productName).toMatch(/watch/i);
      return { actualResult: `200 filter (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "PROD-003",
      title: "returns 404 for unknown product",
      functionTested: "GET /api/products/:id",
      inputData: "non-existent id",
      expectedResult: "404 Not Found",
    },
    async () => {
      const { token } = await authenticateTestUser();
      const agent = request();
      const invalidId = new mongoose.Types.ObjectId().toString();
      const start = performance.now();
      const response = await agent.get(`/api/products/${invalidId}`).set(authHeader(token));
      const durationMs = performance.now() - start;
      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/i);
      return { actualResult: `404 missing (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "PROD-004",
      title: "enforces authentication on catalogue",
      functionTested: "GET /api/products",
      inputData: "no token",
      expectedResult: "401 Unauthorized",
    },
    async () => {
      const agent = request();
      const start = performance.now();
      const response = await agent.get("/api/products");
      const durationMs = performance.now() - start;
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/authentication required/i);
      return { actualResult: `401 unauthorized (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );
});
