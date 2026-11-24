import type { EntityManager } from "@devmentor/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pingDatabase } = vi.hoisted(() => ({ pingDatabase: vi.fn() }));
vi.mock("@devmentor/db", () => ({ pingDatabase }));

import { HealthService } from "./health-service";

const em = {} as EntityManager;
const NOW = new Date("2026-11-24T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HealthService.check", () => {
  it("reports ok when the database answers", async () => {
    pingDatabase.mockImplementation(async () => {
      vi.advanceTimersByTime(12);
      return true;
    });
    const report = await new HealthService({ em }).check();
    expect(pingDatabase).toHaveBeenCalledWith(em);
    expect(report).toEqual({ status: "ok", database: "up", latencyMs: 12, checkedAt: "2026-11-24T12:00:00.012Z" });
  });

  it("reports degraded when the database is down", async () => {
    pingDatabase.mockResolvedValue(false);
    const report = await new HealthService({ em }).check();
    expect(report).toMatchObject({ status: "degraded", database: "down" });
  });
});

describe("HealthService.unavailable", () => {
  it("returns a degraded report without touching the database", () => {
    expect(HealthService.unavailable()).toEqual({
      status: "degraded",
      database: "down",
      latencyMs: 0,
      checkedAt: NOW.toISOString(),
    });
    expect(pingDatabase).not.toHaveBeenCalled();
  });
});
