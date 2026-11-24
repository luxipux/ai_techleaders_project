import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Separator } from "./separator";

const separator = () => document.querySelector('[data-slot="separator"]') as HTMLElement;

describe("Separator", () => {
  it("is a horizontal, decorative divider by default", () => {
    render(<Separator className="my-4" />);
    expect(separator().dataset.orientation).toBe("horizontal");
    expect(separator().getAttribute("role")).toBe("none");
    expect(separator().className).toContain("my-4");
  });

  it("can be vertical and semantic", () => {
    render(<Separator orientation="vertical" decorative={false} />);
    expect(separator().dataset.orientation).toBe("vertical");
    expect(separator().getAttribute("role")).toBe("separator");
    expect(separator().getAttribute("aria-orientation")).toBe("vertical");
  });
});
