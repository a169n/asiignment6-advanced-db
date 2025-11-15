import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
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

function buildArtilleryConfig(baseUrl: string, profile: VuProfile, payloadPath: string) {
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
        path: payloadPath,
        fields: ["email", "password"],
      },
      defaults: {
        headers: {
          "Content-Type": "application/json",
        },
      },
      // Note: metricsByEndpoint plugin requires separate installation
      // Removed to avoid warnings
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
              capture: [{ json: "$.token", as: "token" }],
            },
          },
          {
            get: {
              url: "/api/products",
              headers: { Authorization: "Bearer {{ token }}" },
              capture: [{ json: "$.products[0]._id", as: "productId" }],
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
              capture: [{ json: "$.products[0]._id", as: "productId" }],
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
              capture: [{ json: "$.token", as: "token" }],
            },
          },
          {
            get: {
              url: "/api/products",
              headers: { Authorization: "Bearer {{ token }}" },
              capture: [{ json: "$.products[0]._id", as: "productId" }],
            },
          },
          {
            post: {
              url: "/api/orders",
              headers: { Authorization: "Bearer {{ token }}" },
              json: {
                items: [{ productId: "{{ productId }}", quantity: 1 }],
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
  const aggregate = report?.aggregate || {};
  const counters = aggregate?.counters || {};
  const rates = aggregate?.rates || {};
  const summaries = aggregate?.summaries || {};

  // Artillery v2 structure:
  // - Latency is in summaries.http.response_time
  // - Request rate is in rates.http.request_rate
  // - Total requests is in counters["http.requests"]
  // - Failed requests can be calculated from errors or http_requests_failed
  const latency = summaries["http.response_time"] || {};
  const rps = rates["http.request_rate"] ?? 0;
  const total = counters["http.requests"] ?? 0;

  // Calculate failures from error counters or failed requests
  const errors =
    (counters["errors.ECONNREFUSED"] ?? 0) +
    (counters["errors.ETIMEDOUT"] ?? 0) +
    (counters["errors.Failed capture or match"] ?? 0);
  const httpFailures = counters["http_requests_failed"] ?? 0;
  const failures = httpFailures > 0 ? httpFailures : errors;

  return {
    averageLatency: latency?.mean ?? 0,
    p95Latency: latency?.p95 ?? 0,
    throughput: rps,
    failureRate: total > 0 ? (failures / total) * 100 : 0,
  };
}

async function checkServerHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/products`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok || response.status === 401; // 401 is OK, means server is up but needs auth
  } catch (error) {
    return false;
  }
}

async function main() {
  const baseUrl = process.env.LOADTEST_BASE_URL || "http://localhost:4000";
  console.log(`Using base URL: ${baseUrl}`);

  // Check if server is running
  console.log("Checking server health...");
  const serverHealthy = await checkServerHealth(baseUrl);
  if (!serverHealthy) {
    console.error(
      `❌ Server at ${baseUrl} is not responding. Please ensure the server is running.`
    );
    process.exit(1);
  }
  console.log("✅ Server is responding");

  const artifactsDir = path.resolve(process.cwd(), "artifacts/load");
  mkdirSync(artifactsDir, { recursive: true });

  console.log("Ensuring test accounts exist...");
  await ensureAccounts(baseUrl, path.resolve(process.cwd(), "tests/load/payloads/users.csv"));
  console.log("✅ Test accounts ready");

  const results: Array<{ vus: number; metrics: ReturnType<typeof parseArtilleryReport> }> = [];

  const payloadPath = path.resolve(process.cwd(), "tests/load/payloads/users.csv");

  // Verify payload file exists
  let userCount = 0;
  try {
    const csvContent = readFileSync(payloadPath, "utf-8");
    userCount = csvContent.trim().split(/\r?\n/).length - 1; // Subtract header
    if (userCount < Math.max(...PROFILES.map((p) => p.vus))) {
      console.warn(
        `⚠️  Warning: Only ${userCount} user(s) in CSV, but testing up to ${Math.max(...PROFILES.map((p) => p.vus))} VUs. Artillery will cycle through users.`
      );
    }
  } catch (error) {
    console.error(`Payload file not found: ${payloadPath}`);
    process.exit(1);
  }

  for (const profile of PROFILES) {
    console.log(`\nRunning load test with ${profile.vus} VUs...`);
    const config = buildArtilleryConfig(baseUrl, profile, payloadPath);
    const configPath = path.join(artifactsDir, `artillery-${profile.vus}.json`);
    const outputPath = path.join(artifactsDir, `artillery-${profile.vus}-result.json`);
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    // Run Artillery - inherit stdout to see progress, capture stderr for errors
    // Note: Artillery v2 can take a while (60s+ for the test duration)
    // On Windows, we need to use shell to find npx properly
    const isWindows = process.platform === "win32";
    let run;

    if (isWindows) {
      // On Windows, use shell to execute npx (which resolves to npx.cmd)
      run = spawnSync("npx", ["artillery", "run", configPath, "--output", outputPath], {
        stdio: ["inherit", "inherit", "pipe"],
        encoding: "utf-8",
        cwd: process.cwd(),
        shell: true, // Required on Windows to find npx.cmd
      });
    } else {
      // On Unix-like systems, npx should be directly executable
      run = spawnSync("npx", ["artillery", "run", configPath, "--output", outputPath], {
        stdio: ["inherit", "inherit", "pipe"],
        encoding: "utf-8",
        cwd: process.cwd(),
      });
    }

    // Check if process failed to start
    if (run.error) {
      console.error(`\n❌ Failed to start Artillery for ${profile.vus} VUs:`, run.error.message);
      continue;
    }

    // Check if output file was created (even if status is null, the file might exist)
    const outputExists = existsSync(outputPath);

    // Check exit status (null means process was killed, but file might still exist)
    if (run.status === null && !outputExists) {
      console.error(`\n❌ Artillery process was killed or crashed for ${profile.vus} VUs`);
      if (run.signal) {
        console.error(`   Signal: ${run.signal}`);
      }
      if (run.stderr) {
        console.error("\nError output:");
        console.error(run.stderr);
      }
      continue;
    }

    // If status is non-zero and file doesn't exist, it's a real failure
    if (run.status !== 0 && run.status !== null && !outputExists) {
      console.error(`\n❌ Artillery run failed for ${profile.vus} VUs (exit code: ${run.status})`);
      if (run.stderr) {
        console.error("\nError output:");
        console.error(run.stderr);
      }
      continue;
    }

    // Try to parse the report - if file exists, we can still get metrics
    try {
      if (!outputExists) {
        throw new Error("Output file not found");
      }
      const metrics = parseArtilleryReport(outputPath);
      results.push({ vus: profile.vus, metrics });
      console.log(`✅ Completed ${profile.vus} VUs test`);
    } catch (error) {
      console.error(`Failed to parse Artillery report for ${profile.vus} VUs:`, error);
      if (run.stderr) {
        console.error("\nError output:");
        console.error(run.stderr);
      }
      continue;
    }
  }

  const summaryPath = path.join(artifactsDir, "load-summary.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf-8");

  const markdownRows = results.map(
    (entry) =>
      `| ${entry.vus} | ${entry.metrics.averageLatency.toFixed(1)} | ${entry.metrics.p95Latency.toFixed(1)} | ${entry.metrics.throughput.toFixed(2)} | ${entry.metrics.failureRate.toFixed(2)} |`
  );
  const markdown = [
    "| VUs | Avg Latency (ms) | P95 Latency (ms) | Throughput (req/s) | Failure % |",
    "| --- | --- | --- | --- | --- |",
    ...markdownRows,
  ].join("\n");
  writeFileSync(path.join(artifactsDir, "load-summary.md"), markdown, "utf-8");

  console.log(`\n✅ Load testing complete!`);
  console.log(`   Completed: ${results.length}/${PROFILES.length} test profiles`);
  console.log(`   Results saved to: ${artifactsDir}`);
  if (results.length > 0) {
    console.log(`\nSummary:`);
    console.log(markdown);
  }
}

main().catch((error) => {
  console.error("Load test runner failed", error);
  process.exit(1);
});
