import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_API_BASE_URL || "http://localhost:4000/api",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: false,
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    screenshotOnRunFailure: true,
    video: true,
    env: {
      loadUserPassword: "Password123!",
    },
  },
});
