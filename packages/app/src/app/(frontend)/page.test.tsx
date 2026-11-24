import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the hero with a call to action", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Your personal path from coder to engineer.");
    expect(screen.getByRole("link", { name: "Learn more" }).getAttribute("href")).toBe("#pillars");
  });

  it("renders one card per pillar", () => {
    render(<HomePage />);
    const titles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(titles).toEqual(["Guided learning paths", "Mentor feedback", "Real projects"]);
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });
});
