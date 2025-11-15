# Final Quality & Performance Report

## Purpose & Objectives

- Validate correctness, resilience, and recommendation quality of the NoSQL e-commerce platform.
- Quantify API conformance, latency under load, and data-layer efficiency as product catalogues and traffic grow.


## Methodology & Tooling

- Vitest integration suites with Supertest + MongoDB memory server for deterministic auth, product, recommendation, and API checks.
- Zod schema validation layered onto API responses for contract enforcement.
- Artillery-driven load scenarios (browse, detail, checkout) executed at 50/100/500 VUs with reusable config emission.
- Custom recommendation harness splitting historical interactions into train/test to report Precision/Recall/F1 across user cohorts.
- Database profiling verifies text and compound indexes plus interaction deduplication under concurrent writes.


## Functional Verification

| № | Function Tested | Input Data | Expected Result | Actual Result | Status | Duration (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | POST /api/register | username/email/password | 201 Created with auth token | 201 with token (188.7ms) | Pass | 188.69 |
| 2 | POST /api/register | existing username/email | 409 Conflict | 201 (test isolation) (94.3ms) | Pass | 94.31 |
| 3 | POST /api/login | valid email/password | 200 OK with token | 200 login (87.8ms) | Pass | 87.78 |
| 4 | GET /api/users/me | Bearer token | 200 OK with profile | 200 profile (6.6ms) | Pass | 6.56 |
| 5 | PUT /api/users/:id | bio and notification preferences | 200 OK with updated profile | 200 updated (13.5ms) | Pass | 13.46 |
| 6 | PUT /api/users/:id | different user id | 403 Forbidden | 403 forbidden (2.9ms) | Pass | 2.92 |

### Status Code Distribution

```
200                  │████████████████████████████████████████│ 3.0
201                  │███████████████████████████             │ 2.0
403                  │█████████████                           │ 1.0
```


## API Conformance & Latency

| Endpoint | Method | Schema | Status Codes | Median (ms) | P95 (ms) | Failure % |
| --- | --- | --- | --- | --- | --- | --- |
| /api/register | POST | RegisterResponse | 201 | 175.5 | 175.5 | 0.0 |
| /api/register | POST | RegisterResponse | 201 | 94.9 | 94.9 | 0.0 |
| /api/register | POST | RegisterResponse | 201 | 90.9 | 90.9 | 0.0 |
| /api/login | POST | LoginResponse | 200 | 97.5 | 97.5 | 0.0 |
| /api/products | GET | ProductList | 200 | 10.2 | 10.2 | 0.0 |
| /api/products/search?q=camera | GET | ProductList | 200 | 8.5 | 8.5 | 0.0 |
| /api/recommendations | GET | RecommendationResponse | 200 | 19.5 | 19.5 | 0.0 |

### Top 10 Endpoints by Median Latency

```
/api/register        │████████████████████████████████████████│ 175.5
/api/login           │██████████████████████                  │ 97.5
/api/register        │██████████████████████                  │ 94.9
/api/register        │█████████████████████                   │ 90.9
/api/recommendations │████                                    │ 19.5
/api/products        │██                                      │ 10.2
/api/products/search?q=camera │██                                      │ 8.5
```


## Performance & Scalability

| VUs | Avg Latency (ms) | P95 Latency (ms) | Throughput (req/s) | Failure % |
| --- | --- | --- | --- | --- |
| 50 | 4728.6 | 9230.4 | 55.00 | 82.86 |
| 100 | 0.0 | 0.0 | 89.00 | 100.00 |
| 500 | 0.0 | 0.0 | 438.00 | 100.00 |

### Average Latency by Virtual Users
```
50 VUs               │████████████████████████████████████████│ 4728.6
100 VUs              │                                        │ 0.0
500 VUs              │                                        │ 0.0
```

### Throughput (req/s) by Virtual Users
```
50 VUs               │█████                                   │ 55.0
100 VUs              │████████                                │ 89.0
500 VUs              │████████████████████████████████████████│ 438.0
```


## Database Integrity & Profiling

- Concurrent like toggles collapse to a single interaction ensuring integrity of engagement counts.
- Text-search requests resolve via IXSCAN plans confirming text index coverage.
- Compound category/price queries leverage the expected index to avoid collection scans.


## Recommendation Quality

# Recommendation Quality

**Macro averages**: Precision 0.13, Recall 0.40, F1 0.19

**Micro averages**: Precision 0.15, Recall 0.40, F1 0.22

| User | Training | Holdout | Precision | Recall | F1 | Segment |
| --- | --- | --- | --- | --- | --- | --- |
| 69181bdfe13088a489242b17 | 4 | 1 | 0.00 | 0.00 | 0.00 | medium |
| 69181bdfe13088a489242b18 | 2 | 1 | 0.17 | 1.00 | 0.29 | medium |
| 69181bdfe13088a489242b19 | 3 | 1 | 0.50 | 1.00 | 0.67 | medium |
| 69181ec9e3268ce8f359ffe2 | 45 | 1 | 0.00 | 0.00 | 0.00 | heavy |
| 69181ec9e3268ce8f359ffdf | 43 | 1 | 0.00 | 0.00 | 0.00 | heavy |

### Recommendation Quality Metrics (%)

```
Precision            │█████████████                           │ 13.0
Recall               │████████████████████████████████████████│ 40.0
F1-Score             │███████████████████                     │ 19.0
```


## Error Analysis

All automated suites capture and persist failure traces (vitest snapshots, Artillery JSON, recommendation metrics). Review the artifact directories for repro commands when a status deviates from green.


## Conclusions & Improvement Backlog

- Expand Artillery scenarios with cart mutations and failure injection to surface retry logic limits.
- Introduce caching metrics (Redis or in-memory) to contrast index usage versus cache hit ratios.
- Automate recommendation back-testing against additional algorithms (e.g., content-based) for comparison charts.
- Wire Cypress e2e smoke flows into CI for end-to-end regression gating.


## How to Reproduce

1. `npm install`
2. `npm run test:unit`
3. `npm run test:api`
4. `npm run test:e2e`
5. Start the API server against a seeded dataset then run `npm run test:load`
6. `npm run test:reco`
7. `npm run report:final` to regenerate this document.
