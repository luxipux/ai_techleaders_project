import { fileURLToPath } from "node:url";

import { Migrator } from "@mikro-orm/migrations";
import nextEnv from "@next/env";
import { describe, expect, it, vi } from "vitest";

vi.mock("@next/env", () => ({ default: { loadEnvConfig: vi.fn() } }));

describe("MikroORM CLI config", () => {
  it("loads root env files and configures the Migrator", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/devmentor_test");
    const { default: config } = await import("./mikro-orm.config");

    expect(nextEnv.loadEnvConfig).toHaveBeenCalledWith(fileURLToPath(new URL("../..", import.meta.url)));
    expect(config.clientUrl).toBe("postgres://user:pass@localhost:5432/devmentor_test");
    expect(config.extensions).toEqual([Migrator]);

    const migrationsDir = fileURLToPath(new URL("./src/migrations", import.meta.url));
    expect(config.migrations).toMatchObject({
      tableName: "mikro_orm_migrations",
      path: migrationsDir,
      pathTs: migrationsDir,
      snapshotName: ".snapshot-devmentor",
      transactional: true,
      allOrNothing: true,
    });
  });
});
