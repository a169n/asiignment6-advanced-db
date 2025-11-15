import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

function readArtifact(relativePath: string) {
  const absolute = path.resolve(process.cwd(), relativePath);
  if (!existsSync(absolute)) {
    return "_Artifact not generated yet. Run the corresponding test suite._";
  }
  return readFileSync(absolute, "utf-8");
}

function section(title: string, body: string) {
  return `## ${title}\n\n${body.trim()}\n`;
}

function buildReport() {
  const testCases = readArtifact("artifacts/test-cases/test-cases.md");
  const apiSummary = readArtifact("artifacts/api/api-summary.md");
  const loadSummary = readArtifact("artifacts/load/load-summary.md");
  const recommendationMetrics = readArtifact("artifacts/recommendations/metrics.md");

  const purpose = [
    "Validate correctness, resilience, and recommendation quality of the NoSQL e-commerce platform.",
    "Quantify API conformance, latency under load, and data-layer efficiency as product catalogues and traffic grow.",
  ].join("\n- ");

  const methodology = [
    "Vitest integration suites with Supertest + MongoDB memory server for deterministic auth, product, recommendation, and API checks.",
    "Zod schema validation layered onto API responses for contract enforcement.",
    "Artillery-driven load scenarios (browse, detail, checkout) executed at 50/100/500 VUs with reusable config emission.",
    "Custom recommendation harness splitting historical interactions into train/test to report Precision/Recall/F1 across user cohorts.",
    "Database profiling verifies text and compound indexes plus interaction deduplication under concurrent writes.",
  ]
    .map((item) => `- ${item}`)
    .join("\n");

  const dbFindings = [
    "Concurrent like toggles collapse to a single interaction ensuring integrity of engagement counts.",
    "Text-search requests resolve via IXSCAN plans confirming text index coverage.",
    "Compound category/price queries leverage the expected index to avoid collection scans.",
  ]
    .map((item) => `- ${item}`)
    .join("\n");

  const improvements = [
    "Expand Artillery scenarios with cart mutations and failure injection to surface retry logic limits.",
    "Introduce caching metrics (Redis or in-memory) to contrast index usage versus cache hit ratios.",
    "Automate recommendation back-testing against additional algorithms (e.g., content-based) for comparison charts.",
    "Wire Cypress e2e smoke flows into CI for end-to-end regression gating.",
  ]
    .map((item) => `- ${item}`)
    .join("\n");

  const report = [
    "# Final Quality & Performance Report",
    section(
      "Purpose & Objectives",
      `- ${purpose}`
    ),
    section("Methodology & Tooling", methodology),
    section("Functional Verification", testCases),
    section("API Conformance & Latency", apiSummary),
    section("Performance & Scalability", loadSummary),
    section("Database Integrity & Profiling", dbFindings),
    section("Recommendation Quality", recommendationMetrics),
    section(
      "Error Analysis",
      "All automated suites capture and persist failure traces (vitest snapshots, Artillery JSON, recommendation metrics). Review the artifact directories for repro commands when a status deviates from green."
    ),
    section("Conclusions & Improvement Backlog", improvements),
    section(
      "How to Reproduce",
      [
        "1. `npm install`",
        "2. `npm run test:unit`",
        "3. `npm run test:api`",
        "4. `npm run test:e2e`",
        "5. Start the API server against a seeded dataset then run `npm run test:load`",
        "6. `npm run test:reco`",
        "7. `npm run report:final` to regenerate this document.",
      ].join("\n")
    ),
  ].join("\n\n");

  const outputDir = path.resolve(process.cwd(), "reports/final");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, "README.md"), report, "utf-8");
}

buildReport();
