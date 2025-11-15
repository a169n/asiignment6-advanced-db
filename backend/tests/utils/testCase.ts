import { it } from "vitest";
import { performance } from "node:perf_hooks";
import type { TestCaseMeta } from "./testCaseReporter";
import { recordTestCase } from "./testCaseReporter";

interface TestCaseReturn {
  actualResult?: string;
  durationMs?: number;
}

function normaliseResult(result: unknown): TestCaseReturn {
  if (!result) return {};
  if (typeof result === "string") {
    return { actualResult: result };
  }
  if (typeof result === "object") {
    const payload = result as TestCaseReturn;
    return {
      actualResult: payload.actualResult,
      durationMs: payload.durationMs,
    };
  }
  return {};
}

export function testCase(meta: TestCaseMeta, fn: () => unknown | Promise<unknown>) {
  it(meta.title, async () => {
    const startedAt = performance.now();
    try {
      const result = await fn();
      const payload = normaliseResult(result);
      const duration = payload.durationMs ?? performance.now() - startedAt;
      recordTestCase({
        ...meta,
        actualResult: payload.actualResult ?? meta.expectedResult,
        status: "Pass",
        durationMs: duration,
      });
    } catch (error) {
      const duration = performance.now() - startedAt;
      const actual = error instanceof Error ? error.message : String(error);
      recordTestCase({
        ...meta,
        actualResult: actual,
        status: "Fail",
        durationMs: duration,
      });
      throw error;
    }
  });
}
