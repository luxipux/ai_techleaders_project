import { describe, expect, it } from "vitest";

import { baseProperties as fromBase } from "./base";
import { baseProperties, entities } from "./index";

describe("entity registry", () => {
  it("exposes the registered entities and the shared base columns", () => {
    expect(Array.isArray(entities)).toBe(true);
    expect(baseProperties).toBe(fromBase);
  });
});
