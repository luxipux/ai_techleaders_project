import { describe, expect, it } from "vitest";

import * as core from "./index";

describe("@devmentor/core entry point", () => {
  it("re-exports DI helpers, errors and singletons", () => {
    expect(core.createDiContainer).toBeTypeOf("function");
    expect(core.AppError).toBeTypeOf("function");
    expect(core.globalSingleton).toBeTypeOf("function");
  });
});
