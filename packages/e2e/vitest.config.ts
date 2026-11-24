import { defineConfig } from "vitest/config";

/**
 * Integration tests: ephemeral PostgreSQL + production build (`next start`) + agent-browser.
 * Requires `npm run build` first; use `npm run test:integration` from the repo root.
 */
export default defineConfig({
  test: {
    name: "e2e",
    include: ["tests/**/*.e2e.ts"],
    globalSetup: ["./src/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
