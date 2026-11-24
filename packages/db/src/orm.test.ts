import { MikroORM } from "@mikro-orm/postgresql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { closeOrm, getOrm } from "./orm";

function fakeOrm() {
  return { close: vi.fn(async () => undefined) } as unknown as MikroORM & { close: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/devmentor_test");
});

afterEach(async () => {
  vi.spyOn(MikroORM, "init").mockResolvedValue(fakeOrm());
  await closeOrm();
});

describe("getOrm", () => {
  it("initializes MikroORM once per process with the shared config", async () => {
    const orm = fakeOrm();
    const init = vi.spyOn(MikroORM, "init").mockResolvedValue(orm);

    const first = getOrm({ debug: true });
    const second = getOrm();

    expect(second).toBe(first);
    await expect(first).resolves.toBe(orm);
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0]?.[0]).toMatchObject({
      clientUrl: "postgres://user:pass@localhost:5432/devmentor_test",
      debug: true,
      allowGlobalContext: false,
    });
  });
});

describe("closeOrm", () => {
  it("closes the pool and forgets the instance", async () => {
    const orm = fakeOrm();
    const init = vi.spyOn(MikroORM, "init").mockResolvedValue(orm);
    await getOrm();

    await closeOrm();

    expect(orm.close).toHaveBeenCalledWith(true);
    await getOrm();
    expect(init).toHaveBeenCalledTimes(2);
  });

  it("is a no-op when no ORM was created", async () => {
    await expect(closeOrm()).resolves.toBeUndefined();
  });

  it("ignores an ORM whose initialization failed", async () => {
    vi.spyOn(MikroORM, "init").mockRejectedValue(new Error("unreachable"));
    const pending = getOrm();
    // Close before the failed promise is evicted from the singleton registry.
    const closing = closeOrm();
    await expect(pending).rejects.toThrow("unreachable");
    await expect(closing).resolves.toBeUndefined();
  });
});
