import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import { Browser } from "../src/browser";

describe("public frontend", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = new Browser(inject("baseUrl"));
    await browser.open("/");
  });

  afterAll(async () => {
    await browser.close();
  });

  it("renders the home page", async () => {
    expect(await browser.title()).toBe("DevMentor");
    expect(await browser.text("h1")).toBe("Your personal path from coder to engineer.");
    expect(await browser.count("#pillars article")).toBe(3);
    expect(await browser.pageErrors()).toEqual([]);
  });

  it("exposes the main navigation in the accessibility tree", async () => {
    const { refs } = await browser.snapshot("-i");
    const links = Object.values(refs)
      .filter((ref) => ref.role === "link")
      .map((ref) => ref.name);
    expect(links).toEqual(expect.arrayContaining(["DevMentor", "Backend", "Learn more"]));
  });

  it("navigates to the backend from the header", async () => {
    await browser.clickByRole("link", "Backend");
    await browser.waitForText("System overview for DevMentor operators.");
    expect(await browser.pathname()).toBe("/backend");
  });
});
