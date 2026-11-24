import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BackendLayout, { metadata } from "./layout";

describe("BackendLayout", () => {
  it("renders the admin navigation around the page", () => {
    render(
      <BackendLayout>
        <p>dashboard</p>
      </BackendLayout>,
    );
    const nav = screen.getByRole("navigation");
    expect(nav.textContent).toBe("DashboardView site");
    expect(screen.getByRole("link", { name: "View site" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "DevMentor Backend" }).getAttribute("href")).toBe("/backend");
    expect(screen.getByRole("main").textContent).toBe("dashboard");
  });

  it("keeps backend pages out of search engines", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toEqual({ default: "Backend", template: "%s · DevMentor Backend" });
  });
});
