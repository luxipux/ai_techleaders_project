import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";
import { describe, expect, it, vi } from "vitest";

vi.mock("@next/env", () => ({ loadEnvConfig: vi.fn() }));

describe("next.config", () => {
  it("loads root env files and configures the monorepo build", async () => {
    const { default: config } = await import("./next.config");
    const repoRoot = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");

    expect(loadEnvConfig).toHaveBeenCalledWith(repoRoot);
    expect(config.turbopack?.root).toBe(repoRoot);
    expect(config.outputFileTracingRoot).toBe(repoRoot);
    expect(config.serverExternalPackages).toEqual(
      expect.arrayContaining(["@mikro-orm/core", "@mikro-orm/postgresql", "pg"]),
    );
  });
});
