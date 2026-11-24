import { describe, expect, it, vi } from "vitest";

import type { AppContainer } from "./container";
import type { HealthReport } from "./services/health-service";

const { getRequestContainer } = vi.hoisted(() => ({ getRequestContainer: vi.fn() }));
vi.mock("./container", () => ({ getRequestContainer }));

import { getHealthReport } from "./health";

const report: HealthReport = { status: "ok", database: "up", latencyMs: 3, checkedAt: "2026-11-24T12:00:00.000Z" };

describe("getHealthReport", () => {
  it("delegates to the request-scoped HealthService", async () => {
    const check = vi.fn(async () => report);
    getRequestContainer.mockResolvedValue({ cradle: { healthService: { check } } } as unknown as AppContainer);
    await expect(getHealthReport()).resolves.toBe(report);
    expect(check).toHaveBeenCalledOnce();
  });

  it("degrades gracefully when the container cannot be built", async () => {
    const error = new Error("DATABASE_URL is not set");
    getRequestContainer.mockRejectedValue(error);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(getHealthReport()).resolves.toMatchObject({ status: "degraded", database: "down", latencyMs: 0 });
    expect(consoleError).toHaveBeenCalledWith("[health] container unavailable", error);
  });
});
