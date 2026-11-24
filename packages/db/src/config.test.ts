import { describe, expect, it, vi } from "vitest";

import { createOrmConfig } from "./config";
import { entities } from "./entities/index";

const URL = "postgres://user:pass@localhost:5432/devmentor_test";

function withEnv(env: Record<string, string | undefined>) {
  vi.stubEnv("DATABASE_URL", URL);
  vi.stubEnv("DB_POOL_MIN", undefined);
  vi.stubEnv("DB_POOL_MAX", undefined);
  vi.stubEnv("DB_DEBUG", undefined);
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
}

describe("createOrmConfig", () => {
  it("builds the defaults from DATABASE_URL", () => {
    withEnv({});
    const config = createOrmConfig();
    expect(config.clientUrl).toBe(URL);
    expect(config.entities).toEqual([...entities]);
    expect(config.entities).not.toBe(entities);
    expect(config.discovery).toEqual({ warnWhenNoEntities: false });
    expect(config.pool).toEqual({ min: 0, max: 10, idleTimeoutMillis: 30_000 });
    expect(config.debug).toBe(false);
    expect(config.allowGlobalContext).toBe(false);
  });

  it("reads the pool size and debug flag from the environment", () => {
    withEnv({ DB_POOL_MIN: "2", DB_POOL_MAX: "25", DB_DEBUG: "true" });
    const config = createOrmConfig();
    expect(config.pool).toMatchObject({ min: 2, max: 25 });
    expect(config.debug).toBe(true);
  });

  it("treats empty pool variables as unset", () => {
    withEnv({ DB_POOL_MIN: "", DB_POOL_MAX: "" });
    expect(createOrmConfig().pool).toMatchObject({ min: 0, max: 10 });
  });

  it("rejects a non-integer pool size", () => {
    withEnv({ DB_POOL_MAX: "many" });
    expect(() => createOrmConfig()).toThrow('DB_POOL_MAX must be an integer, got "many"');
  });

  it("requires DATABASE_URL", () => {
    withEnv({ DATABASE_URL: "" });
    expect(() => createOrmConfig()).toThrow(/DATABASE_URL is not set/);
  });

  it("applies overrides last", () => {
    withEnv({});
    const config = createOrmConfig({ debug: true, allowGlobalContext: true });
    expect(config.debug).toBe(true);
    expect(config.allowGlobalContext).toBe(true);
  });
});
