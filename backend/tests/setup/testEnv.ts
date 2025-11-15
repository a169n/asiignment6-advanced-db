import { beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import supertest from "supertest";
import { createApp } from "@/app";
import { connectDatabase } from "@/config/database";

let mongo: MongoMemoryServer | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __TEST_AGENT__: supertest.SuperTest<supertest.Test> | undefined;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: "7.0.5" } });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.AUTO_SEED = "false";
  process.env.JWT_SECRET = "test-secret";
  await connectDatabase();
  const app = createApp({ loggingFormat: "tiny" });
  global.__TEST_AGENT__ = supertest(app);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
  global.__TEST_AGENT__ = undefined;
});

export function getAgent() {
  if (!global.__TEST_AGENT__) {
    throw new Error("Test agent not initialised");
  }
  return global.__TEST_AGENT__;
}
