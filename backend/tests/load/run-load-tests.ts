import { mkdirSync, writeFileSync, readFileSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

interface VuProfile {
  vus: number;
  duration: number;
}

const PROFILES: VuProfile[] = [
  { vus: 50, duration: 60 },
  { vus: 100, duration: 60 },
  { vus: 500, duration: 60 },
];

function loadUsersCsv(csvPath: string) {
  const content = readFileSync(csvPath, "utf-8");
  const [headerLine, ...rows] = content.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return rows.map((row) => {
    const values = row.split(",");
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    return record;
  });
}

async function ensureAccounts(baseUrl: string, csvPath: string) {
  const users = loadUsersCsv(csvPath);
  for (const user of users) {
    const username = user.email.split("@")[0];
    await fetch(`${baseUrl}/api/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, email: user.email, password: user.password }),
    });
  }
}

function buildArtilleryConfig(baseUrl: string, profile: VuProfile) {
  return {
    config: {
      target: baseUrl,
      phases: [
        {
          duration: profile.duration,
          arrivalRate: profile.vus,
          name: `${profile.vus}-vus`,
        },
      ],
      payload: {
        path: "tests/load/payloads/users.csv",
        fields: ["email", "password"],
      },
      defaults: {
        headers: {
          "Content-Type": "application/json",
        },
      },
      plugins: {
        metricsByEndpoint: { summary: true },
      },
    },
    scenarios: [
      {
        name: "Browse catalogue",
        weight: 5,
        flow: [
          {
            post: {
              url: "/api/login",
              json: {
                email: "{{ email }}",
                password: "{{ password }}",
              },
              capture: [
                { json: "$.token", as: "token" },
              ],
            },
          },
          {
            get: {
              url: "/api/products",
              headers: { Authorization: "Bearer {{ token }}" },
              capture: [
                { json: "$.products[0]._id", as: "productId" },
              ],
            },
          },
          {
            get: {
              url: "/api/products/search",
              query: { q: "{{ productId }}" },
              headers: { Authorization: "Bearer {{ token }}" },
            },
          },
          {
            get: {
              url: "/api/recommendations",
              headers: { Authorization: "Bearer {{ token }}" },
            },
          },
        ],
      },
      {
        name: "Product detail and interaction",
        weight: 3,
        flow: [
          {
            post: {
              url: "/api/login",
              json: {
                email: "{{ email }}",
                password: "{{ password }}",
              },
              capture: [
                { json: "$.token", as: "token" },
                { json: "$.user._id", as: "userId" },
              ],
            },
          },
          {
            get: {
              url: "/api/products",
              query: { limit: 12 },
              headers: { Authorization: "Bearer {{ token }}" },
              capture: [
                { json: "$.products[0]._id", as: "productId" },
              ],
            },
          },
          {
            get: {
              url: "/api/products/{{ productId }}",
              headers: { Authorization: "Bearer {{ token }}" },
            },
          },
          {
            post: {
              url: "/api/interactions",
              headers: { Authorization: "Bearer {{ token }}" },
              json: { productId: "{{ productId }}", type: "like" },
            },
          },
          {
            post: {
              url: "/api/interactions",
              headers: { Authorization: "Bearer {{ token }}" },
              json: { productId: "{{ productId }}", type: "view" },
            },
          },
        ],
      },
      {
        name: "Checkout flow",
        weight: 2,
        flow: [
          {
            post: {
              url: "/api/login",
              json: {
                email: "{{ email }}",
                password: "{{ password }}",
              },
              capture: [
                { json: "$.token", as: "token" },
              ],
            },
          },
          {
            get: {
              url: "/api/products",
              headers: { Authorization: "Bearer {{ token }}" },
              capture: [
                { json: "$.products[0]._id", as: "productId" },
              ],
            },
          },
          {
            post: {
              url: "/api/orders",
              headers: { Authorization: "Bearer {{ token }}" },
              json: {
                items: [
                  { productId: "{{ productId }}", quantity: 1 },
                ],
                shippingAddress: "123 Performance Way",
                contactEmail: "{{ email }}",
              },
            },
          },
          {
            get: {
              url: "/api/orders/my",
              headers: { Authorization: "Bearer {{ token }}" },
            },
          },
        ],
      },
    ],
  };
}

function parseArtilleryReport(reportPath: string) {
  const report = JSON.parse(readFileSync(reportPath, "utf-8"));
  const latency = report?.aggregate?.latency;
  const rps = report?.aggregate?.rates?.httpRequestRate ?? 0;
  const failures = report?.aggregate?.counters?.http_requests_failed ?? 0;
  const total = report?.aggregate?.counters?.http.requests ?? 0;
  return {
    averageLatency: latency?.mean ?? 0,
    p95Latency: latency?.p95 ?? 0,
    throughput: rps,
    failureRate: total ? (failures / total) * 100 : 0,
  };
}

async function main() {
  const baseUrl = process.env.LOADTEST_BASE_URL || "http://localhost:4000";
  const artifactsDir = path.resolve(process.cwd(), "artifacts/load");
  mkdirSync(artifactsDir, { recursive: true });
  await ensureAccounts(baseUrl, path.resolve(process.cwd(), "tests/load/payloads/users.csv"));

  const results: Array<{ vus: number; metrics: ReturnType<typeof parseArtilleryReport> }> = [];

  for (const profile of PROFILES) {
    const config = buildArtilleryConfig(baseUrl, profile);
    const configPath = path.join(artifactsDir, `artillery-${profile.vus}.json`);
    const outputPath = path.join(artifactsDir, `artillery-${profile.vus}-result.json`);
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    const run = spawnSync("npx", ["artillery", "run", configPath, "--output", outputPath], {
      stdio: "inherit",
    });

    if (run.status !== 0) {
      console.error(`Artillery run failed for ${profile.vus} VUs`);
      continue;
    }

    const metrics = parseArtilleryReport(outputPath);
    results.push({ vus: profile.vus, metrics });
  }

  const summaryPath = path.join(artifactsDir, "load-summary.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf-8");

  const markdownRows = results.map((entry) =>
    `| ${entry.vus} | ${entry.metrics.averageLatency.toFixed(1)} | ${entry.metrics.p95Latency.toFixed(1)} | ${entry.metrics.throughput.toFixed(2)} | ${entry.metrics.failureRate.toFixed(2)} |`
  );
  const markdown = [
    "| VUs | Avg Latency (ms) | P95 Latency (ms) | Throughput (req/s) | Failure % |",
    "| --- | --- | --- | --- | --- |",
    ...markdownRows,
  ].join("\n");
  writeFileSync(path.join(artifactsDir, "load-summary.md"), markdown, "utf-8");
}

main().catch((error) => {
  console.error("Load test runner failed", error);
  process.exit(1);
});
