import type { TestProject } from "vitest/node";

import { startAppServer } from "./app-server";
import { startDatabase } from "./database";
import { repoRoot } from "./paths";
import { run } from "./process";

declare module "vitest" {
  export interface ProvidedContext {
    /** Base URL of the app under test, e.g. `http://127.0.0.1:41234`. */
    baseUrl: string;
    /** Connection string of the ephemeral, migrated database the app uses. */
    databaseUrl: string;
  }
}

/** Ephemeral PostgreSQL → migrations (MikroORM CLI) → `next start`; torn down after the run. */
export default async function setup(project: TestProject) {
  const database = await startDatabase();
  try {
    await run("npm", ["run", "db:migrate"], { cwd: repoRoot, env: { ...process.env, DATABASE_URL: database.url } });
    const app = await startAppServer(database.url);
    project.provide("baseUrl", app.baseUrl);
    project.provide("databaseUrl", database.url);
    return async () => {
      await app.stop();
      await database.stop();
    };
  } catch (error) {
    await database.stop();
    throw error;
  }
}
