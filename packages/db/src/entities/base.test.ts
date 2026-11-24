import { describe, expect, it } from "vitest";

import { baseProperties } from "./base";

type Options = { onCreate?: () => unknown; onUpdate?: () => unknown; defaultRaw?: string; primary?: boolean };
const options = (builder: unknown) => (builder as { "~options": Options })["~options"];

describe("baseProperties", () => {
  it("uses a database-generated uuid primary key", () => {
    expect(options(baseProperties.id)).toMatchObject({ primary: true, defaultRaw: "gen_random_uuid()" });
  });

  it("sets createdAt on insert", () => {
    expect(options(baseProperties.createdAt).onCreate?.()).toBeInstanceOf(Date);
  });

  it("sets updatedAt on insert and on every update", () => {
    const updatedAt = options(baseProperties.updatedAt);
    expect(updatedAt.onCreate?.()).toBeInstanceOf(Date);
    expect(updatedAt.onUpdate?.()).toBeInstanceOf(Date);
  });
});
