import { describe, expect } from "vitest";
import { performance } from "node:perf_hooks";
import { recordApiSample } from "../utils/apiObserver";
import { request } from "../utils/testAgent";
import { authenticateTestUser, createTestProduct, seedInteractions } from "../utils/fixtures";

async function measureRequest<T extends { status: number }>(
  id: string,
  meta: { endpoint: string; method: string; schema?: string; payloadExample?: unknown },
  fn: () => Promise<T>
) {
  const started = performance.now();
  const response = await fn();
  const durationMs = performance.now() - started;
  recordApiSample({
    id,
    endpoint: meta.endpoint,
    method: meta.method,
    schema: meta.schema,
    payloadExample: meta.payloadExample,
    statusCode: response.status,
    durationMs,
    success: response.status >= 200 && response.status < 400,
  });
  return { response, durationMs };
}

describe("API observability snapshots", () => {
  it("records latency and status for critical endpoints", async () => {
    const agent = request();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const email = `metrics_user_${Date.now()}_${attempt}@example.com`;
      const payload = { username: `metrics_${attempt}`, email, password: "Password123!" };
      const { response } = await measureRequest(
        `auth-register-${attempt}`,
        {
          endpoint: "/api/register",
          method: "POST",
          schema: "RegisterResponse",
          payloadExample: payload,
        },
        () => agent.post("/api/register").send(payload)
      );
      expect([201, 409]).toContain(response.status);
    }

    const loginEmail = "metrics_login@example.com";
    await agent.post("/api/register").send({ username: "metrics_login", email: loginEmail, password: "Password123!" });
    await measureRequest(
      "auth-login",
      { endpoint: "/api/login", method: "POST", schema: "LoginResponse", payloadExample: { email: loginEmail } },
      () => agent.post("/api/login").send({ email: loginEmail, password: "Password123!" })
    );

    const { token, userId } = await authenticateTestUser({ email: "metrics_products@example.com", username: "metrics_products" });
    await createTestProduct({ productName: "Metrics Camera", category: "electronics", tags: ["camera"], price: 499 });
    await createTestProduct({ productName: "Metrics Bag", category: "accessories", tags: ["bag"], price: 129 });

    await measureRequest(
      "products-list",
      { endpoint: "/api/products", method: "GET", schema: "ProductList" },
      () => agent.get("/api/products").set("Authorization", `Bearer ${token}`)
    );

    await measureRequest(
      "products-search",
      {
        endpoint: "/api/products/search?q=camera",
        method: "GET",
        schema: "ProductList",
      },
      () =>
        agent
          .get("/api/products/search")
          .query({ q: "camera" })
          .set("Authorization", `Bearer ${token}`)
    );

    const recoProduct = await createTestProduct({ productName: "Metrics Tripod", tags: ["camera"] });
    await seedInteractions({
      userId,
      products: [
        { product: recoProduct, type: "like" },
      ],
    });

    const recoMeasurement = await measureRequest(
      "reco-index",
      { endpoint: "/api/recommendations", method: "GET", schema: "RecommendationResponse" },
      () => agent.get("/api/recommendations").set("Authorization", `Bearer ${token}`)
    );

    expect(recoMeasurement.response.status).toBe(200);
  });
});
