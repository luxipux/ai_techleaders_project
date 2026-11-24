import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import { Browser } from "../src/browser";

describe("backend dashboard", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = new Browser(inject("baseUrl"));
    await browser.open("/backend");
  });

  afterAll(async () => {
    await browser.close();
  });

  it("renders the dashboard with its title template", async () => {
    expect(await browser.title()).toBe("Dashboard · DevMentor Backend");
    expect(await browser.text("h1")).toBe("Dashboard");
    expect(await browser.pageErrors()).toEqual([]);
  });

  it("shows a healthy app and a connected database (served by the ephemeral PostgreSQL)", async () => {
    expect(await browser.nthText(0, '[data-slot="badge"]')).toBe("Healthy");
    expect(await browser.nthText(1, '[data-slot="badge"]')).toBe("Connected");
  });

  it("links to the raw health JSON", async () => {
    expect(await browser.text('a[data-slot="button"]')).toBe("Raw JSON");
    expect(await browser.attr('a[data-slot="button"]', "href")).toBe("/api/health");
  });

  it("links back to the public site", async () => {
    await browser.clickByRole("link", "View site");
    await browser.waitForText("Your personal path from coder to engineer.");
    expect(await browser.pathname()).toBe("/");
  });
});
