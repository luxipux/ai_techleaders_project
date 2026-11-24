import { afterEach, describe, expect, it, vi } from "vitest";

import { clearGlobalSingleton, globalSingleton, peekGlobalSingleton } from "./singleton";

const registry = globalThis as typeof globalThis & { __devmentorSingletons?: Map<string, unknown> };

afterEach(() => {
  delete registry.__devmentorSingletons;
});

describe("globalSingleton", () => {
  it("creates the value once and returns it on later calls", () => {
    const factory = vi.fn(() => ({ id: 1 }));
    const first = globalSingleton("key", factory);
    const second = globalSingleton("key", factory);
    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("stores values on globalThis so they survive module reloads", () => {
    globalSingleton("key", () => "value");
    expect(registry.__devmentorSingletons?.get("key")).toBe("value");
  });

  it("keys singletons independently", () => {
    expect(globalSingleton("a", () => "A")).toBe("A");
    expect(globalSingleton("b", () => "B")).toBe("B");
  });

  it("memoizes a resolved promise", async () => {
    const factory = vi.fn(async () => "ready");
    const first = globalSingleton("async", factory);
    expect(globalSingleton("async", factory)).toBe(first);
    await expect(first).resolves.toBe("ready");
    expect(peekGlobalSingleton("async")).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("evicts a rejected promise so the next call can retry", async () => {
    const failing = globalSingleton("async", () => Promise.reject(new Error("down")));
    await expect(failing).rejects.toThrow("down");
    expect(peekGlobalSingleton("async")).toBeUndefined();

    const retried = globalSingleton("async", async () => "up");
    await expect(retried).resolves.toBe("up");
  });

  it("does not evict a newer value when an old promise rejects", async () => {
    let rejectOld!: (reason: Error) => void;
    const old = globalSingleton("async", () => new Promise((_, reject) => (rejectOld = reject)));
    clearGlobalSingleton("async");
    const fresh = globalSingleton("async", async () => "fresh");

    rejectOld(new Error("stale"));
    await expect(old).rejects.toThrow("stale");
    expect(peekGlobalSingleton("async")).toBe(fresh);
  });
});

describe("peekGlobalSingleton", () => {
  it("returns undefined before the registry exists", () => {
    expect(peekGlobalSingleton("missing")).toBeUndefined();
  });

  it("returns an existing value without creating one", () => {
    globalSingleton("key", () => 42);
    expect(peekGlobalSingleton("key")).toBe(42);
    expect(peekGlobalSingleton("other")).toBeUndefined();
  });
});

describe("clearGlobalSingleton", () => {
  it("is a no-op before the registry exists", () => {
    expect(() => clearGlobalSingleton("missing")).not.toThrow();
  });

  it("removes the value so the factory runs again", () => {
    globalSingleton("key", () => "first");
    clearGlobalSingleton("key");
    expect(peekGlobalSingleton("key")).toBeUndefined();
    expect(globalSingleton("key", () => "second")).toBe("second");
  });
});
