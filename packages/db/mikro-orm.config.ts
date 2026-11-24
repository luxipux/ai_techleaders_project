/**
 * MikroORM CLI configuration (migrations). Not imported by the app runtime, so the
 * Migrator (and its dependencies) never end up in the Next.js bundle.
 */
import { fileURLToPath } from "node:url";

import { Migrator } from "@mikro-orm/migrations";
// `@next/env` is CommonJS: under ESM only its default export is available.
import nextEnv from "@next/env";

import { createOrmConfig } from "./src/config";

// Load env files from the repo root, exactly like the Next.js app does.
nextEnv.loadEnvConfig(fileURLToPath(new URL("../..", import.meta.url)));

const migrationsDir = fileURLToPath(new URL("./src/migrations", import.meta.url));

export default createOrmConfig({
  extensions: [Migrator],
  migrations: {
    tableName: "mikro_orm_migrations",
    path: migrationsDir,
    pathTs: migrationsDir,
    glob: "!(*.d).ts",
    transactional: true,
    allOrNothing: true,
    snapshot: true,
    // Stable name (default embeds the database name, which differs per developer).
    snapshotName: ".snapshot-devmentor",
  },
});
