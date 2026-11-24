import type { EntityManager } from "@mikro-orm/postgresql";
import { describe, expect, it, vi } from "vitest";

import { pingDatabase, toPagination } from "./helpers";

function fakeEm(execute: () => Promise<unknown>) {
  const connection = { execute: vi.fn(execute) };
  const em = { getConnection: () => connection } as unknown as EntityManager;
  return { em, connection };
}

describe("pingDatabase", () => {
  it("returns true when `select 1` succeeds", async () => {
    const { em, connection } = fakeEm(async () => [{ "?column?": 1 }]);
    await expect(pingDatabase(em)).resolves.toBe(true);
    expect(connection.execute).toHaveBeenCalledWith("select 1");
  });

  it("returns false when the query fails", async () => {
    const { em } = fakeEm(async () => {
      throw new Error("connection refused");
    });
    await expect(pingDatabase(em)).resolves.toBe(false);
  });
});

describe("toPagination", () => {
  it("defaults to the first page of 20", () => {
    expect(toPagination()).toEqual({ limit: 20, offset: 0 });
  });

  it("computes the offset from page and page size", () => {
    expect(toPagination(3, 10)).toEqual({ limit: 10, offset: 20 });
  });

  it("clamps the page size to [1, maxPageSize]", () => {
    expect(toPagination(1, 0)).toEqual({ limit: 1, offset: 0 });
    expect(toPagination(1, 500)).toEqual({ limit: 100, offset: 0 });
    expect(toPagination(2, 500, 50)).toEqual({ limit: 50, offset: 50 });
  });

  it("clamps the page to at least 1 and truncates fractions", () => {
    expect(toPagination(-4, 10)).toEqual({ limit: 10, offset: 0 });
    expect(toPagination(2.9, 10.7)).toEqual({ limit: 10, offset: 10 });
  });
});
