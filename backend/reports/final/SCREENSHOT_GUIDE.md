# Screenshot and Data Collection Guide

This guide will help you collect all necessary screenshots and data for your assignment report.

## Quick Checklist

- [ ] Test execution screenshots (3-4 screenshots)
- [ ] API testing screenshots (3-4 screenshots)
- [ ] Load testing screenshots (4-5 screenshots)
- [ ] Database testing screenshots (3 screenshots)
- [ ] Recommendation quality screenshots (4 screenshots)
- [ ] Charts and graphs (3-4 charts)

---

## 1. Test Execution Screenshots

### Screenshot 1: Test Execution Terminal Output
**Command to run:**
```bash
cd backend
npm run test:api
```

**What to capture:**
- Terminal window showing all tests passing
- Should show "✓" checkmarks for each test
- Should show test count (e.g., "15 passed")

**Save as:** `screenshot-01-test-execution.png`

---

### Screenshot 2: Test Cases JSON File
**File location:**
```
backend/artifacts/test-cases/test-cases.json
```

**What to capture:**
- Open the JSON file in VS Code or any editor
- Show the test case data structure
- Can also show the markdown version: `test-cases.md`

**Save as:** `screenshot-02-test-cases-json.png`

---

## 2. API Testing Screenshots

### Screenshot 3: Cypress API Response Screenshots
**File locations:**
```
backend/cypress/screenshots/api-smoke.cy.ts/
  - 01-register-response.png
  - 02-login-success.png
  - 03-products-list.png
  - 04-like-interaction-created.png
```

**What to capture:**
- Use the existing screenshots from Cypress
- Or run Cypress again: `npm run test:e2e`
- Show at least 2-3 of these screenshots

**Save as:** Use existing filenames or rename to `screenshot-03-cypress-api-*.png`

---

### Screenshot 4: API Response Validation
**Command to run:**
```bash
cd backend
npm run test:api
```

**What to capture:**
- Terminal output showing Zod schema validation
- Look for lines mentioning "schema" or "validation"
- Or show the test code that validates responses

**Save as:** `screenshot-04-api-validation.png`

---

### Screenshot 5: Postman/API Tool Status Codes
**Option 1 - Use Postman:**
- Import API endpoints
- Show requests with different status codes (200, 400, 401, 404)
- Take screenshot of Postman collection

**Option 2 - Create Summary:**
- Create a simple table or chart showing status code distribution
- Use Excel or Google Sheets

**Save as:** `screenshot-05-api-status-codes.png`

---

## 3. Load Testing Screenshots

### Screenshot 6: Artillery Configuration
**File location:**
```
backend/artifacts/load/artillery-50.json
```

**What to capture:**
- Open the JSON file in VS Code
- Show the configuration structure
- Highlight the VU count and scenarios

**Save as:** `screenshot-06-artillery-config.png`

---

### Screenshot 7: Artillery Test Execution
**Command to run:**
```bash
cd backend
npm run test:load
```

**What to capture:**
- Terminal showing Artillery running
- Progress indicators
- Real-time metrics during test execution
- Wait for at least one test profile to complete

**Save as:** `screenshot-07-artillery-execution.png`

---

### Screenshot 8: Artillery Results JSON
**File location:**
```
backend/artifacts/load/artillery-50-result.json
```

**What to capture:**
- Open the JSON file in VS Code
- Show the metrics structure
- Can also show `load-summary.json` or `load-summary.md`

**Save as:** `screenshot-08-artillery-results.png`

---

### Screenshot 9: Latency vs Virtual Users Chart
**Data to use:**
```
50 VUs: 4728.6 ms
100 VUs: 0.0 ms (failed)
500 VUs: 0.0 ms (failed)
```

**How to create:**
1. Open Excel or Google Sheets
2. Create a bar chart or line chart
3. X-axis: Virtual Users (50, 100, 500)
4. Y-axis: Average Latency (ms)
5. Add title: "Average Latency vs Virtual Users"

**Save as:** `screenshot-09-latency-chart.png`

---

### Screenshot 10: Throughput vs Virtual Users Chart
**Data to use:**
```
50 VUs: 55 req/s
100 VUs: 89 req/s
500 VUs: 438 req/s
```

**How to create:**
1. Open Excel or Google Sheets
2. Create a bar chart or line chart
3. X-axis: Virtual Users (50, 100, 500)
4. Y-axis: Throughput (requests/second)
5. Add title: "Throughput vs Virtual Users"

**Save as:** `screenshot-10-throughput-chart.png`

---

## 4. Database Testing Screenshots

### Screenshot 11: Database Query Execution
**Option 1 - MongoDB Compass:**
1. Connect to your MongoDB database
2. Run a query: `db.products.find().limit(5)`
3. Take screenshot showing results

**Option 2 - Terminal:**
```bash
mongosh
use your_database
db.products.find().limit(5)
```

**Save as:** `screenshot-11-database-query.png`

---

### Screenshot 12: MongoDB Query Execution Plan
**Command to run:**
```bash
mongosh
use your_database
db.products.find({ productName: /camera/i }).explain("executionStats")
```

**What to capture:**
- Show the execution plan
- Look for "IXSCAN" (index scan) in the output
- Or use MongoDB Compass to show the explain plan

**Save as:** `screenshot-12-query-plan.png`

---

### Screenshot 13: Database Indexes
**Command to run:**
```bash
mongosh
use your_database
db.products.getIndexes()
```

**What to capture:**
- Show the list of indexes
- Or use MongoDB Compass to show indexes visually
- Should show text indexes and compound indexes

**Save as:** `screenshot-13-database-indexes.png`

---

## 5. Recommendation Quality Screenshots

### Screenshot 14: Recommendation Metrics JSON
**File location:**
```
backend/artifacts/recommendations/metrics.json
```

**What to capture:**
- Open the JSON file in VS Code
- Show the metrics structure
- Highlight macro and micro averages

**Save as:** `screenshot-14-recommendation-metrics.png`

---

### Screenshot 15: Recommendation Metrics Table
**File location:**
```
backend/artifacts/recommendations/metrics.md
```

**What to capture:**
- Open the markdown file
- Show the formatted table
- Or create a formatted table in Excel/Word

**Save as:** `screenshot-15-recommendation-table.png`

---

### Screenshot 16: Precision/Recall/F1 Chart by Segment
**Data to use:**
```
Medium Users:
  Precision: 0.22 (22%)
  Recall: 0.67 (67%)
  F1: 0.32 (32%)

Heavy Users:
  Precision: 0.00 (0%)
  Recall: 0.00 (0%)
  F1: 0.00 (0%)
```

**How to create:**
1. Open Excel or Google Sheets
2. Create a grouped bar chart
3. X-axis: User Segments (Medium, Heavy)
4. Y-axis: Percentage (0-100%)
5. Three bars per segment: Precision, Recall, F1
6. Add title: "Recommendation Quality by User Segment"

**Save as:** `screenshot-16-recommendation-chart.png`

---

### Screenshot 17: Recommendation Algorithm Code
**File location:**
```
backend/src/services/recommendationService.ts
```

**What to capture:**
- Open the file in VS Code
- Show the main recommendation function
- Highlight key algorithm logic
- Can show 20-30 lines of code

**Save as:** `screenshot-17-recommendation-code.png`

---

## 6. Additional Screenshots (Optional but Recommended)

### Screenshot 18: Error Logs (if available)
**What to capture:**
- Terminal output showing any errors
- Or test failure logs
- Or application error logs

**Save as:** `screenshot-18-error-logs.png`

---

### Screenshot 19: System Architecture Diagram
**How to create:**
1. Use draw.io, Lucidchart, or PowerPoint
2. Create a simple architecture diagram showing:
   - Frontend (Next.js)
   - Backend (Express/Node.js)
   - Database (MongoDB)
   - Testing tools (Vitest, Cypress, Artillery)
3. Add labels and connections

**Save as:** `screenshot-19-architecture.png`

---

## Quick Command Reference

```bash
# Navigate to backend
cd backend

# Run all tests
npm run test:unit      # Unit tests
npm run test:api       # Functional/API tests
npm run test:e2e      # E2E tests (Cypress)
npm run test:load     # Load tests (Artillery)
npm run test:reco     # Recommendation quality tests

# Generate reports
npm run report:final  # Generate final report

# View artifacts
# Test cases: backend/artifacts/test-cases/
# API metrics: backend/artifacts/api/
# Load results: backend/artifacts/load/
# Recommendations: backend/artifacts/recommendations/
```

---

## Tips for Taking Good Screenshots

1. **Use High Resolution**: Take screenshots at full resolution, you can resize later
2. **Clean Terminal**: Clear terminal before taking screenshots
3. **Highlight Important Parts**: Use arrows or boxes to highlight key metrics
4. **Consistent Naming**: Use the naming convention provided
5. **Add Captions**: In Word, add captions below each screenshot explaining what it shows
6. **Crop Unnecessary Parts**: Remove unnecessary UI elements
7. **Use Full Screen**: For terminal/editor screenshots, use full screen mode

---

## File Organization

Create a folder structure like this:

```
screenshots/
  ├── 01-test-execution.png
  ├── 02-test-cases-json.png
  ├── 03-cypress-api-*.png (multiple files)
  ├── 04-api-validation.png
  ├── 05-api-status-codes.png
  ├── 06-artillery-config.png
  ├── 07-artillery-execution.png
  ├── 08-artillery-results.png
  ├── 09-latency-chart.png
  ├── 10-throughput-chart.png
  ├── 11-database-query.png
  ├── 12-query-plan.png
  ├── 13-database-indexes.png
  ├── 14-recommendation-metrics.png
  ├── 15-recommendation-table.png
  ├── 16-recommendation-chart.png
  ├── 17-recommendation-code.png
  ├── 18-error-logs.png (optional)
  └── 19-architecture.png (optional)
```

---

## Converting Markdown to Word

1. Open the `ASSIGNMENT_REPORT.md` file
2. Use one of these methods:
   - **Pandoc**: `pandoc ASSIGNMENT_REPORT.md -o ASSIGNMENT_REPORT.docx`
   - **VS Code**: Install "Markdown to Word" extension
   - **Online**: Use markdowntoword.com or similar
   - **Manual**: Copy content to Word and format

3. After conversion:
   - Replace all "SCREENSHOT PLACEHOLDER X" text with actual screenshots
   - Format tables properly
   - Add page numbers
   - Add table of contents
   - Check formatting and spacing

---

Good luck with your assignment! 🎓


