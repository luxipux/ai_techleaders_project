import { afterEach, expect, it, vi } from "vitest";

vi.mock("./lib/setup.mjs", () => ({ main: vi.fn(async () => 1) }));

afterEach(() => {
  process.exitCode = undefined;
});

it("runs setup and sets the process exit code from its result", async () => {
  const { main } = await import("./lib/setup.mjs");

  await import("./setup.mjs");

  expect(main).toHaveBeenCalledOnce();
  expect(process.exitCode).toBe(1);
});
