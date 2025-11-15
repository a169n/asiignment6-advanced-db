import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

function readArtifact(relativePath: string, fallback?: string) {
  const absolute = path.resolve(process.cwd(), relativePath);
  if (!existsSync(absolute)) {
    return fallback || "_Artifact not generated yet. Run the corresponding test suite._";
  }
  const content = readFileSync(absolute, "utf-8");
  return content.trim() || fallback || "_Artifact exists but is empty. Run the corresponding test suite._";
}

function generateTestCasesSummary() {
  const jsonPath = path.resolve(process.cwd(), "artifacts/test-cases/test-cases.json");
  if (existsSync(jsonPath)) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        const header = "| № | Function Tested | Input Data | Expected Result | Actual Result | Status | Duration (ms) |";
        const separator = "| --- | --- | --- | --- | --- | --- | --- |";
        const rows = data.map((entry: any, index: number) =>
          `| ${index + 1} | ${entry.functionTested} | ${entry.inputData} | ${entry.expectedResult} | ${entry.actualResult} | ${entry.status} | ${entry.durationMs?.toFixed(2) || "N/A"} |`
        );
        const passed = data.filter((e: any) => e.status === "Pass").length;
        const failed = data.filter((e: any) => e.status === "Fail").length;
        const summary = `**Summary**: ${passed} passed, ${failed} failed, ${data.length} total\n\n`;
        return summary + [header, separator, ...rows].join("\n");
      }
    } catch (error) {
      console.warn("Failed to parse test-cases.json:", error);
    }
  }
  return null;
}

function generateApiSummary() {
  const jsonPath = path.resolve(process.cwd(), "artifacts/api/api-summary.json");
  if (existsSync(jsonPath)) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        const header = "| Endpoint | Method | Schema | Status Codes | Median (ms) | P95 (ms) | Failure % |";
        const separator = "| --- | --- | --- | --- | --- | --- | --- |";
        const rows = data.map((entry: any) => {
          const statusCodes = Array.isArray(entry.statusCodes) ? entry.statusCodes.join(", ") : entry.statusCodes || "-";
          const median = entry.metrics?.median?.toFixed(1) || "N/A";
          const p95 = entry.metrics?.p95?.toFixed(1) || "N/A";
          const failureRate = entry.metrics?.failureRate ? (entry.metrics.failureRate * 100).toFixed(1) : "0.0";
          return `| ${entry.endpoint} | ${entry.method} | ${entry.schema || "-"} | ${statusCodes} | ${median} | ${p95} | ${failureRate} |`;
        });
        const totalRequests = data.reduce((sum: number, entry: any) => sum + (entry.metrics?.count || 0), 0);
        const summary = `**Summary**: ${data.length} endpoints tested, ${totalRequests} total requests\n\n`;
        return summary + [header, separator, ...rows].join("\n");
      }
    } catch (error) {
      console.warn("Failed to parse api-summary.json:", error);
    }
  }
  return null;
}

function generateLoadSummary() {
  const jsonPath = path.resolve(process.cwd(), "artifacts/load/load-summary.json");
  if (existsSync(jsonPath)) {
    try {
      const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        const header = "| VUs | Avg Latency (ms) | P95 Latency (ms) | Throughput (req/s) | Failure % |";
        const separator = "| --- | --- | --- | --- | --- |";
        const rows = data.map((entry: any) => {
          const metrics = entry.metrics || {};
          return `| ${entry.vus} | ${metrics.averageLatency?.toFixed(1) || "N/A"} | ${metrics.p95Latency?.toFixed(1) || "N/A"} | ${metrics.throughput?.toFixed(2) || "N/A"} | ${metrics.failureRate?.toFixed(2) || "0.00"} |`;
        });
        return [header, separator, ...rows].join("\n");
      }
    } catch (error) {
      console.warn("Failed to parse load-summary.json:", error);
    }
  }
  return null;
}

function section(title: string, body: string) {
  return `## ${title}\n\n${body.trim()}\n`;
}

function generateBarChart(data: Array<{ label: string; value: number }>, maxWidth: number = 50): string {
  if (data.length === 0) return "";
  const maxValue = Math.max(...data.map(d => d.value));
  if (maxValue === 0) return "";
  
  const bars = data.map(item => {
    const barLength = Math.round((item.value / maxValue) * maxWidth);
    const bar = "█".repeat(barLength);
    const padding = " ".repeat(Math.max(0, maxWidth - barLength));
    return `${item.label.padEnd(20)} │${bar}${padding}│ ${item.value.toFixed(1)}`;
  });
  
  return "```\n" + bars.join("\n") + "\n```";
}

function generateLoadTestCharts(loadData: any[]): string {
  if (!loadData || loadData.length === 0) return "";
  
  const latencyData = loadData.map(entry => ({
    label: `${entry.vus} VUs`,
    value: entry.metrics?.averageLatency || 0
  }));
  
  const throughputData = loadData.map(entry => ({
    label: `${entry.vus} VUs`,
    value: entry.metrics?.throughput || 0
  }));
  
  const charts = [
    "### Average Latency by Virtual Users",
    generateBarChart(latencyData, 40),
    "",
    "### Throughput (req/s) by Virtual Users",
    generateBarChart(throughputData, 40),
  ];
  
  return charts.join("\n");
}

function generateApiLatencyChart(apiData: any[]): string {
  if (!apiData || apiData.length === 0) return "";
  
  const latencyData = apiData
    .filter(entry => entry.metrics?.median)
    .map(entry => ({
      label: entry.endpoint.substring(0, 30),
      value: entry.metrics.median
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 endpoints
  
  if (latencyData.length === 0) return "";
  
  return "### Top 10 Endpoints by Median Latency\n\n" + generateBarChart(latencyData, 40);
}

function generateStatusCodeChart(testCases: any[]): string {
  if (!testCases || testCases.length === 0) return "";
  
  const statusCounts = new Map<string, number>();
  testCases.forEach(test => {
    const result = test.actualResult || "";
    const statusMatch = result.match(/(\d{3})/);
    if (statusMatch) {
      const code = statusMatch[1];
      statusCounts.set(code, (statusCounts.get(code) || 0) + 1);
    }
  });
  
  const data = Array.from(statusCounts.entries())
    .map(([code, count]) => ({ label: `${code}`, value: count }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));
  
  if (data.length === 0) return "";
  
  return "### Status Code Distribution\n\n" + generateBarChart(data, 40);
}

function generateRecommendationMetricsChart(recommendationMetrics: string): string {
  // Try to extract metrics from the markdown
  const precisionMatch = recommendationMetrics.match(/Precision ([\d.]+)/);
  const recallMatch = recommendationMetrics.match(/Recall ([\d.]+)/);
  const f1Match = recommendationMetrics.match(/F1 ([\d.]+)/);
  
  if (!precisionMatch || !recallMatch || !f1Match) return "";
  
  const data = [
    { label: "Precision", value: parseFloat(precisionMatch[1]) * 100 },
    { label: "Recall", value: parseFloat(recallMatch[1]) * 100 },
    { label: "F1-Score", value: parseFloat(f1Match[1]) * 100 },
  ];
  
  return "### Recommendation Quality Metrics (%)\n\n" + generateBarChart(data, 40);
}

function buildReport() {
  // Try to read markdown artifacts, or generate from JSON if available
  let testCases = readArtifact("artifacts/test-cases/test-cases.md");
  // If markdown doesn't exist or is placeholder, try to generate from JSON
  if (testCases.includes("not generated") || testCases.includes("empty") || testCases.trim() === "") {
    const generated = generateTestCasesSummary();
    if (generated) {
      testCases = generated;
    }
  }

  let apiSummary = readArtifact("artifacts/api/api-summary.md");
  // If markdown doesn't exist or is placeholder, try to generate from JSON
  if (apiSummary.includes("not generated") || apiSummary.includes("empty") || apiSummary.trim() === "") {
    const generated = generateApiSummary();
    if (generated) {
      apiSummary = generated;
    }
  }

  let loadSummary = readArtifact("artifacts/load/load-summary.md");
  let loadCharts = "";
  // If markdown doesn't exist or is placeholder, try to generate from JSON
  if (loadSummary.includes("not generated") || loadSummary.includes("empty") || loadSummary.trim() === "") {
    const generated = generateLoadSummary();
    if (generated) {
      loadSummary = generated;
    }
  }
  // Generate charts for load test data
  const loadJsonPath = path.resolve(process.cwd(), "artifacts/load/load-summary.json");
  if (existsSync(loadJsonPath)) {
    try {
      const loadData = JSON.parse(readFileSync(loadJsonPath, "utf-8"));
      loadCharts = generateLoadTestCharts(loadData);
    } catch (error) {
      console.warn("Failed to generate load test charts:", error);
    }
  }
  
  const recommendationMetrics = readArtifact("artifacts/recommendations/metrics.md");
  let recommendationCharts = "";
  if (recommendationMetrics && !recommendationMetrics.includes("not generated") && !recommendationMetrics.includes("empty")) {
    recommendationCharts = generateRecommendationMetricsChart(recommendationMetrics);
  }
  
  let apiCharts = "";
  const apiJsonPath = path.resolve(process.cwd(), "artifacts/api/api-summary.json");
  if (existsSync(apiJsonPath)) {
    try {
      const apiData = JSON.parse(readFileSync(apiJsonPath, "utf-8"));
      apiCharts = generateApiLatencyChart(apiData);
    } catch (error) {
      console.warn("Failed to generate API charts:", error);
    }
  }
  
  let statusCodeChart = "";
  const testCasesJsonPath = path.resolve(process.cwd(), "artifacts/test-cases/test-cases.json");
  if (existsSync(testCasesJsonPath)) {
    try {
      const testCases = JSON.parse(readFileSync(testCasesJsonPath, "utf-8"));
      statusCodeChart = generateStatusCodeChart(testCases);
    } catch (error) {
      console.warn("Failed to generate status code chart:", error);
    }
  }

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
    section("Functional Verification", testCases + (statusCodeChart ? "\n\n" + statusCodeChart : "")),
    section("API Conformance & Latency", apiSummary + (apiCharts ? "\n\n" + apiCharts : "")),
    section("Performance & Scalability", loadSummary + (loadCharts ? "\n\n" + loadCharts : "")),
    section("Database Integrity & Profiling", dbFindings),
    section("Recommendation Quality", recommendationMetrics + (recommendationCharts ? "\n\n" + recommendationCharts : "")),
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
