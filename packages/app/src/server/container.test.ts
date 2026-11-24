import type { MikroORM } from "@devmentor/db";
import { clearGlobalSingleton } from "@devmentor/core/singleton";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getOrm, fork } = vi.hoisted(() => ({ getOrm: vi.fn(), fork: vi.fn() }));
vi.mock("@devmentor/db", () => ({ getOrm, pingDatabase: vi.fn() }));

import { createRequestScope, getContainer, getRequestContainer } from "./container";
import { HealthService } from "./services/health-service";

let forks = 0;

beforeEach(() => {
  forks = 0;
  fork.mockImplementation(() => ({ fork: ++forks }));
  getOrm.mockResolvedValue({ em: { fork } } as unknown as MikroORM);
});

afterEach(() => {
  clearGlobalSingleton("devmentor:container");
});

describe("getContainer", () => {
  it("builds the root container once per process", async () => {
    const root = await getContainer();
    expect(await getContainer()).toBe(root);
    expect(getOrm).toHaveBeenCalledTimes(1);
    expect(root.cradle.orm).toBe(await getOrm.mock.results[0]?.value);
  });
});

describe("createRequestScope", () => {
  it("gives every request its own forked EntityManager", async () => {
    const first = await createRequestScope();
    const second = await createRequestScope();
    expect(first.cradle.em).toEqual({ fork: 1 });
    expect(second.cradle.em).toEqual({ fork: 2 });
  });

  it("resolves scoped services once per scope", async () => {
    const scope = await createRequestScope();
    const service = scope.cradle.healthService;
    expect(service).toBeInstanceOf(HealthService);
    expect(scope.cradle.healthService).toBe(service);
    expect((await createRequestScope()).cradle.healthService).not.toBe(service);
  });

  it("does not expose the request EntityManager on the root container", async () => {
    const root = await getContainer();
    expect(() => root.cradle.em).toThrow();
  });
});

describe("getRequestContainer", () => {
  it("creates a request scope", async () => {
    const scope = await getRequestContainer();
    expect(scope.cradle.em).toEqual({ fork: 1 });
  });
});
