import { describe, expect, it, vi } from "vitest";

import type { HealthReport } from "@/server/services/health-service";

const { connection, getHealthReport } = vi.hoisted(() => ({
  connection: vi.fn(async () => undefined),
  getHealthReport: vi.fn<() => Promise<HealthReport>>(),
}));
vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/health", () => ({ getHealthReport }));

import { GET } from "./route";

const checkedAt = "2026-11-24T12:00:00.000Z";

describe("GET /api/health", () => {
  it("returns 200 with the report when healthy", async () => {
    const report: HealthReport = { status: "ok", database: "up", latencyMs: 2, checkedAt };
    getHealthReport.mockResolvedValue(report);

    const response = await GET();

    expect(connection).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(report);
  });

  it("returns 503 when degraded", async () => {
    getHealthReport.mockResolvedValue({ status: "degraded", database: "down", latencyMs: 0, checkedAt });
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ status: "degraded" });
  });
});
