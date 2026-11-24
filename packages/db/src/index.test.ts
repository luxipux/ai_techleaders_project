import { describe, expect, it } from "vitest";

import * as db from "./index";

describe("@devmentor/db entry point", () => {
  it("re-exports config, ORM lifecycle, helpers and entities", () => {
    for (const name of ["createOrmConfig", "getOrm", "closeOrm", "pingDatabase", "toPagination"] as const) {
      expect(db[name]).toBeTypeOf("function");
    }
    expect(Array.isArray(db.entities)).toBe(true);
    expect(db.baseProperties).toBeDefined();
  });
});
