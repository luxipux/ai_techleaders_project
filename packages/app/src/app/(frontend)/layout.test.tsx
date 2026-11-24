import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import FrontendLayout from "./layout";

afterEach(() => {
  vi.useRealTimers();
});

describe("FrontendLayout", () => {
  it("renders navigation, the page and a footer with the current year", () => {
    vi.useFakeTimers({ now: new Date("2031-05-01T00:00:00Z"), toFake: ["Date"] });
    render(
      <FrontendLayout>
        <p>page content</p>
      </FrontendLayout>,
    );

    expect(screen.getByRole("link", { name: "DevMentor" })).toHaveProperty("pathname", "/");
    expect(screen.getByRole("link", { name: "Backend" })).toHaveProperty("pathname", "/backend");
    expect(screen.getByRole("main").textContent).toBe("page content");
    expect(screen.getByRole("contentinfo").textContent).toBe("© 2031 DevMentor");
  });
});
