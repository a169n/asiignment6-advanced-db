import { describe, expect } from "vitest";
import { performance } from "node:perf_hooks";
import { request } from "../utils/testAgent";
import { testCase } from "../utils/testCase";
import { authenticateTestUser, defaultPassword } from "../utils/fixtures";

describe("Authentication module", () => {
  testCase(
    {
      id: "AUTH-001",
      title: "registers a new user and returns token",
      functionTested: "POST /api/register",
      inputData: "username/email/password",
      expectedResult: "201 Created with auth token",
    },
    async () => {
      const agent = request();
      const payload = {
        username: "case_user",
        email: "case_user@example.com",
        password: defaultPassword,
      };
      const start = performance.now();
      const response = await agent.post("/api/register").send(payload);
      const durationMs = performance.now() - start;
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(payload.email);
      return { actualResult: `201 with token (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "AUTH-002",
      title: "rejects duplicate registrations",
      functionTested: "POST /api/register",
      inputData: "existing username/email",
      expectedResult: "409 Conflict",
    },
    async () => {
      const agent = request();
      const payload = {
        username: "dup_user",
        email: "dup_user@example.com",
        password: defaultPassword,
      };
      await agent.post("/api/register").send(payload);
      const start = performance.now();
      const response = await agent.post("/api/register").send(payload);
      const durationMs = performance.now() - start;
      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already exists/i);
      return { actualResult: `409 duplicate (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "AUTH-003",
      title: "logs in a registered user",
      functionTested: "POST /api/login",
      inputData: "valid email/password",
      expectedResult: "200 OK with token",
    },
    async () => {
      const agent = request();
      const credentials = { email: "login_user@example.com", username: "login_user" };
      await agent.post("/api/register").send({ ...credentials, password: defaultPassword });
      const start = performance.now();
      const response = await agent.post("/api/login").send({
        email: credentials.email,
        password: defaultPassword,
      });
      const durationMs = performance.now() - start;
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(credentials.email);
      return { actualResult: `200 login (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );

  testCase(
    {
      id: "AUTH-004",
      title: "retrieves current user profile",
      functionTested: "GET /api/users/me",
      inputData: "Bearer token",
      expectedResult: "200 OK with profile",
    },
    async () => {
      const { token, userId } = await authenticateTestUser();
      const agent = request();
      const start = performance.now();
      const response = await agent
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);
      const durationMs = performance.now() - start;
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(userId);
      return { actualResult: `200 profile (${durationMs.toFixed(1)}ms)`, durationMs };
    }
  );
});
