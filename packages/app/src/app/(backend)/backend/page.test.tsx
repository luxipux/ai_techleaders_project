import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HealthReport } from "@/server/services/health-service";

const { connection, getHealthReport } = vi.hoisted(() => ({
  connection: vi.fn(async () => undefined),
  getHealthReport: vi.fn<() => Promise<HealthReport>>(),
}));
vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/health", () => ({ getHealthReport }));

import BackendDashboardPage, { metadata } from "./page";

const checkedAt = "2026-11-24T12:34:56.000Z";

async function renderPage(report: HealthReport) {
  getHealthReport.mockResolvedValue(report);
  render(await BackendDashboardPage());
}

describe("BackendDashboardPage", () => {
  it("shows a healthy application and connected database", async () => {
    await renderPage({ status: "ok", database: "up", latencyMs: 7, checkedAt });

    expect(connection).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Dashboard");
    expect(screen.getByText("Healthy").dataset.variant).toBe("default");
    expect(screen.getByText("Connected").dataset.variant).toBe("secondary");
    expect(screen.getByText(/7 ms ·/).textContent).toBe(
      `7 ms · ${new Date(checkedAt).toLocaleTimeString("en-GB")}`,
    );
    expect(screen.getByRole("link", { name: "Raw JSON" }).getAttribute("href")).toBe("/api/health");
  });

  it("shows a degraded application and unreachable database", async () => {
    await renderPage({ status: "degraded", database: "down", latencyMs: 0, checkedAt });

    expect(screen.getByText("Degraded").dataset.variant).toBe("destructive");
    expect(screen.getByText("Unreachable").dataset.variant).toBe("destructive");
  });

  it("flags a degraded application whose database is still up", async () => {
    await renderPage({ status: "degraded", database: "up", latencyMs: 1, checkedAt });

    expect(screen.getByText("Degraded")).toBeDefined();
    expect(screen.getByText("Connected")).toBeDefined();
  });

  it("uses the backend title (the layout template does not apply to its own segment)", () => {
    expect(metadata.title).toEqual({ absolute: "Dashboard · DevMentor Backend" });
  });
});
