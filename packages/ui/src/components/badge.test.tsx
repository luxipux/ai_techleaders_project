import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { cn } from "../lib/utils";
import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("renders a span with the default variant", () => {
    render(<Badge className="extra">New</Badge>);
    const badge = screen.getByText("New");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.dataset.slot).toBe("badge");
    expect(badge.dataset.variant).toBe("default");
    expect(badge.className).toContain("bg-primary");
    expect(badge.className).toContain("extra");
  });

  it.each(["secondary", "destructive", "outline", "ghost", "link"] as const)("renders the %s variant", (variant) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    const badge = screen.getByText(variant);
    expect(badge.dataset.variant).toBe(variant);
    expect(badge.className).toBe(cn(badgeVariants({ variant })));
  });

  it("renders its child element when asChild is set", () => {
    render(
      <Badge asChild>
        <a href="/inbox">Inbox</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Inbox" });
    expect(link.dataset.slot).toBe("badge");
    expect(link.className).toContain("bg-primary");
  });
});
