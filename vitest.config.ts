import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Unit-test packages; `packages/e2e` has its own config (integration tests). */
const UNIT_PACKAGES = "packages/{core,db,app,ui}";

export default defineConfig({
  resolve: {
    alias: {
      "@/": r("./packages/app/src/"),
      // The real package throws outside the React Server bundle; unit tests run in plain Node/jsdom.
      "server-only": r("./test/stubs/server-only.ts"),
    },
  },
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [`${UNIT_PACKAGES}/**/*.test.ts`],
        },
      },
      {
        extends: true,
        test: {
          name: "unit-dom",
          environment: "jsdom",
          include: [`${UNIT_PACKAGES}/**/*.test.tsx`],
          setupFiles: [r("./test/setup-dom.ts")],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: [
        `${UNIT_PACKAGES}/src/**/*.{ts,tsx}`,
        "packages/db/mikro-orm.config.ts",
        "packages/app/next.config.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "packages/db/src/migrations/**"],
      reporter: ["text", "html", "lcov", "json-summary"],
      // AGENTS.md → "Testing": all code must be fully covered by unit tests.
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
