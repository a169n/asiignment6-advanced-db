import type supertest from "supertest";

declare global {
  // eslint-disable-next-line no-var
  var __TEST_AGENT__: supertest.SuperTest<supertest.Test> | undefined;
}

export {};
