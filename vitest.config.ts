import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * tests/integration needs a live database with pgvector, which no developer
 * machine has by default, so it is excluded here and run by the CI job that
 * owns the extension: `pnpm test:integration`.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "node",
    exclude: ["node_modules/**", "tests/integration/**"],
  },
});
