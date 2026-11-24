import { randomBytes } from "node:crypto";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";

export interface TestDatabase {
  url: string;
  stop(): Promise<void>;
}

/** PostgreSQL version used by the ephemeral container (keep in line with production). */
export const POSTGRES_IMAGE = "postgres:17-alpine";

/**
 * Starts an ephemeral PostgreSQL for one test run.
 *
 * - Default: a fresh testcontainers PostgreSQL (needs Docker; CI runners have it).
 * - `E2E_DATABASE_URL` set (no Docker, e.g. the sandbox): creates a throwaway database
 *   on that server and drops it on `stop()`. The URL's own database is never touched.
 */
export async function startDatabase(): Promise<TestDatabase> {
  const serverUrl = process.env.E2E_DATABASE_URL;
  return serverUrl ? createThrowawayDatabase(serverUrl) : startContainer();
}

async function startContainer(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).withDatabase("devmentor").start();
  return {
    url: container.getConnectionUri(),
    stop: async () => {
      await container.stop();
    },
  };
}

async function createThrowawayDatabase(serverUrl: string): Promise<TestDatabase> {
  const name = `devmentor_e2e_${randomBytes(6).toString("hex")}`;
  await admin(serverUrl, `create database "${name}"`);
  const url = new URL(serverUrl);
  url.pathname = `/${name}`;
  return {
    url: url.toString(),
    stop: () => admin(serverUrl, `drop database if exists "${name}" with (force)`),
  };
}

async function admin(serverUrl: string, sql: string): Promise<void> {
  const client = new pg.Client({ connectionString: serverUrl });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}
