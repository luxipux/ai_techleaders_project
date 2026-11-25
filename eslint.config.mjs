import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Builds a `no-restricted-imports` rule from `[pattern, message]` pairs. */
const restrict = (...groups) => [
  "error",
  { patterns: groups.map(([group, message]) => ({ group: [group], message })) },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The Next.js app lives in a workspace package, not at the repo root.
    settings: { next: { rootDir: "packages/app/" } },
  },

  // Architecture boundaries (see AGENTS.md → "Architecture rules").
  {
    files: ["packages/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(
        ["@devmentor/*", "@devmentor/core must not depend on other workspace packages."],
        ["react", "@devmentor/core is framework-agnostic: no React."],
        ["next", "@devmentor/core is framework-agnostic: no Next.js."],
        ["next/*", "@devmentor/core is framework-agnostic: no Next.js."],
        ["@mikro-orm/*", "Database code belongs in @devmentor/db."],
      ),
    },
  },
  {
    files: ["packages/db/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(
        ["@devmentor/app", "@devmentor/db may only depend on @devmentor/core."],
        ["@devmentor/app/*", "@devmentor/db may only depend on @devmentor/core."],
        ["@devmentor/ui", "@devmentor/db may only depend on @devmentor/core."],
        ["@devmentor/ui/*", "@devmentor/db may only depend on @devmentor/core."],
        ["react", "@devmentor/db must not use React."],
        ["next", "@devmentor/db must not use Next.js runtime APIs."],
        ["next/*", "@devmentor/db must not use Next.js runtime APIs."],
      ),
    },
  },
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(
        ["@devmentor/app", "@devmentor/ui must not depend on the app."],
        ["@devmentor/app/*", "@devmentor/ui must not depend on the app."],
        ["@devmentor/db", "UI components must not access the database."],
        ["@devmentor/db/*", "UI components must not access the database."],
        ["@mikro-orm/*", "UI components must not access the database."],
      ),
    },
  },
  {
    files: ["packages/app/src/app/(frontend)/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(
        [
          "@devmentor/ui/components/*",
          "Frontend pages use plain Tailwind CSS; shadcn-ui components are for backend pages.",
        ],
      ),
    },
  },

  {
    files: ["packages/e2e/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        [
          "@devmentor/*",
          "Integration tests are black-box: drive the running app over HTTP / agent-browser, not its packages.",
        ],
      ),
    },
  },

  globalIgnores([
    "**/coverage/**",
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/next-env.d.ts",
    // Agent skills are third-party tooling, not project source.
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
