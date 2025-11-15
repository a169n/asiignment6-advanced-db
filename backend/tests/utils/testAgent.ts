import type supertest from "supertest";
import { getAgent } from "../setup/testEnv";

export function request(): supertest.SuperTest<supertest.Test> {
  return getAgent();
}
