import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins conditional classes", () => {
    const hidden = false;
    expect(cn("p-2", hidden && "hidden", { "font-bold": true, italic: false })).toBe("p-2 font-bold");
  });

  it("lets later Tailwind classes win conflicts", () => {
    expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
  });
});
