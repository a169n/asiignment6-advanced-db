import { mkdirSync, writeFileSync } from "fs";
import path from "path";

export interface TestCaseMeta {
  id: string;
  title: string;
  functionTested: string;
  inputData: string;
  expectedResult: string;
}

export interface TestCaseResult extends TestCaseMeta {
  actualResult: string;
  status: "Pass" | "Fail";
  durationMs: number;
}

const results: TestCaseResult[] = [];
let flushed = false;

export function recordTestCase(result: TestCaseResult) {
  results.push(result);
}

function formatMarkdownTable(entries: TestCaseResult[]) {
  const header = "| № | Function Tested | Input Data | Expected Result | Actual Result | Status | Duration (ms) |";
  const separator = "| --- | --- | --- | --- | --- | --- | --- |";
  const rows = entries.map((entry, index) =>
    `| ${index + 1} | ${entry.functionTested} | ${entry.inputData} | ${entry.expectedResult} | ${entry.actualResult} | ${entry.status} | ${entry.durationMs.toFixed(2)} |`
  );
  return [header, separator, ...rows].join("\n");
}

function flush() {
  if (flushed || !results.length) {
    return;
  }
  flushed = true;
  const outputDir = process.env.TEST_CASE_OUTPUT_DIR || path.resolve(process.cwd(), "artifacts/test-cases");
  mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "test-cases.json");
  const mdPath = path.join(outputDir, "test-cases.md");
  writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
  writeFileSync(mdPath, formatMarkdownTable(results), "utf-8");
}

process.on("exit", flush);
process.on("SIGINT", () => {
  flush();
  process.exit(130);
});
process.on("SIGTERM", () => {
  flush();
  process.exit(143);
});
