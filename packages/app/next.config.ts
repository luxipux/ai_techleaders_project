import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Env files live at the repo root (shared with the MikroORM CLI in @devmentor/db).
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  // Monorepo root: lets Turbopack resolve and watch the sibling workspace packages.
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  // MikroORM loads drivers dynamically and is ESM-only: keep it out of the server bundle.
  serverExternalPackages: [
    "@mikro-orm/core",
    "@mikro-orm/sql",
    "@mikro-orm/postgresql",
    "pg",
  ],
};

export default nextConfig;
