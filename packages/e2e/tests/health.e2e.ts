import pg from "pg";
import { describe, expect, inject, it } from "vitest";

describe("GET /api/health", () => {
  it("reports the app and the ephemeral database as up", async () => {
    const response = await fetch(`${inject("baseUrl")}/api/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const report = (await response.json()) as Record<string, unknown>;
    expect(report).toMatchObject({ status: "ok", database: "up" });
    expect(report.latencyMs).toBeTypeOf("number");
    expect(Date.parse(String(report.checkedAt))).not.toBeNaN();
  });
});

describe("ephemeral database", () => {
  it("has been migrated through the MikroORM CLI", async () => {
    const client = new pg.Client({ connectionString: inject("databaseUrl") });
    await client.connect();
    try {
      const { rows } = await client.query<{ name: string | null }>(
        "select to_regclass('public.mikro_orm_migrations')::text as name",
      );
      expect(rows[0]?.name).toBe("mikro_orm_migrations");
    } finally {
      await client.end();
    }
  });
});
