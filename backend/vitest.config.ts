import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["tests/setup/testEnv.ts"],
    include: ["tests/**/*.{test,spec}.ts"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reportsDirectory: "artifacts/coverage",
      reporter: ["text", "html"]
    },
    env: {
      AUTO_SEED: "false",
      JWT_SECRET: "test-secret"
    },
    threads: false,
    hookTimeout: 60000,
    testTimeout: 60000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
