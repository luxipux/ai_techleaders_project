import { defineConfig, type Options } from "@mikro-orm/postgresql";

import { entities } from "./entities/index";

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) throw new Error(`${name} must be an integer, got "${raw}"`);
  return value;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local at the repo root.");
  }
  return url;
}

/**
 * Single source of truth for the MikroORM configuration, shared by the app runtime
 * (`getOrm()`) and the CLI (`mikro-orm.config.ts`). Pass overrides for scripts/tests.
 */
export function createOrmConfig(overrides: Partial<Options> = {}): Options {
  return defineConfig({
    clientUrl: requireDatabaseUrl(),
    entities: [...entities],
    // Entities are registered explicitly (no folder scanning), which works with bundlers.
    discovery: { warnWhenNoEntities: false },
    pool: {
      min: readInt("DB_POOL_MIN", 0),
      max: readInt("DB_POOL_MAX", 10),
      idleTimeoutMillis: 30_000,
    },
    debug: process.env.DB_DEBUG === "true",
    // Fail fast on the global EntityManager: always work on a fork (request scope).
    allowGlobalContext: false,
    ...overrides,
  });
}
