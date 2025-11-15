import { mkdirSync, writeFileSync } from "fs";
import path from "path";

interface ApiObservationMeta {
  id: string;
  endpoint: string;
  method: string;
  schema?: string;
  payloadExample?: unknown;
}

interface ApiSample extends ApiObservationMeta {
  statusCode: number;
  durationMs: number;
  success: boolean;
}

interface AggregatedObservation extends ApiObservationMeta {
  samples: ApiSample[];
}

const registry = new Map<string, AggregatedObservation>();
let flushed = false;

function summariseDurations(durations: number[]) {
  if (!durations.length) {
    return { average: 0, median: 0, p95: 0 };
  }
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const average = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  const p95 = sorted[p95Index];
  return { average, median, p95 };
}

export function recordApiSample(sample: ApiSample) {
  const existing = registry.get(sample.id);
  if (existing) {
    existing.samples.push(sample);
  } else {
    registry.set(sample.id, { ...sample, samples: [sample] });
  }
}

function createMarkdown(observations: AggregatedObservation[]) {
  const header = "| Endpoint | Method | Schema | Status Codes | Median (ms) | P95 (ms) | Failure % |";
  const separator = "| --- | --- | --- | --- | --- | --- | --- |";
  const rows = observations.map((observation) => {
    const durations = observation.samples.map((sample) => sample.durationMs);
    const { median, p95 } = summariseDurations(durations);
    const statusSummary = Array.from(new Set(observation.samples.map((sample) => sample.statusCode))).join(", ");
    const failures = observation.samples.filter((sample) => !sample.success).length;
    const failureRate = observation.samples.length ? (failures / observation.samples.length) * 100 : 0;
    return `| ${observation.endpoint} | ${observation.method} | ${observation.schema ?? "-"} | ${statusSummary} | ${median.toFixed(1)} | ${p95.toFixed(1)} | ${failureRate.toFixed(1)} |`;
  });
  return [header, separator, ...rows].join("\n");
}

export function flush() {
  if (flushed || !registry.size) {
    return;
  }
  flushed = true;
  const outputDir = process.env.API_REPORT_DIR || path.resolve(process.cwd(), "artifacts/api");
  mkdirSync(outputDir, { recursive: true });
  const observations = Array.from(registry.values());
  const serialisable = observations.map((observation) => {
    const durations = observation.samples.map((sample) => sample.durationMs);
    const { average, median, p95 } = summariseDurations(durations);
    const successCount = observation.samples.filter((sample) => sample.success).length;
    const failureCount = observation.samples.length - successCount;
    const failureRate = observation.samples.length ? failureCount / observation.samples.length : 0;
    return {
      id: observation.id,
      endpoint: observation.endpoint,
      method: observation.method,
      schema: observation.schema,
      samplePayload: observation.samples[0]?.payloadExample,
      statusCodes: Array.from(new Set(observation.samples.map((sample) => sample.statusCode))),
      metrics: {
        count: observation.samples.length,
        average,
        median,
        p95,
        failureRate,
      },
    };
  });

  writeFileSync(path.join(outputDir, "api-summary.json"), JSON.stringify(serialisable, null, 2), "utf-8");
  writeFileSync(path.join(outputDir, "api-summary.md"), createMarkdown(observations), "utf-8");
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
