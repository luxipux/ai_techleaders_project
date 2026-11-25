import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  isPostgresUrl,
  lockInSync,
  redactUrl,
  runSetup,
  satisfiesEngine,
  SetupError,
  type EnvFile,
  type SetupDeps,
  type SetupFs,
} from "./setup.mjs";

const ROOT = path.join(path.sep, "repo");

/** In-memory `SetupFs` over `{ "relative/path": "contents" }`. */
function fakeFs(files: Record<string, string>): SetupFs & { files: Map<string, string> } {
  const map = new Map(Object.entries(files).map(([file, contents]) => [path.join(ROOT, file), contents]));
  return {
    files: map,
    existsSync: (file) => map.has(file),
    readFileSync: (file) => {
      const contents = map.get(file);
      if (contents === undefined) throw Object.assign(new Error(`ENOENT: ${file}`), { code: "ENOENT" });
      return contents;
    },
    copyFileSync: (src, dest) => {
      if (map.has(dest)) throw Object.assign(new Error(`EEXIST: ${dest}`), { code: "EEXIST" });
      map.set(dest, map.get(src) ?? "");
    },
    readdirSync: (dir) => {
      const prefix = dir + path.sep;
      const names = [...map.keys()].filter((file) => file.startsWith(prefix)).map((file) => file.slice(prefix.length).split(path.sep)[0] ?? "");
      return [...new Set(names)];
    },
  };
}

function without<T extends object>(value: T, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([k]) => k !== key));
}

const rootManifest = { name: "r", workspaces: ["packages/*"], devDependencies: { vitest: "^5" } };
const appManifest = { name: "@r/app", dependencies: { next: "16.0.0" } };
const lockPackages = {
  "": { name: "r", workspaces: ["packages/*"], devDependencies: { vitest: "^5" } },
  "packages/app": { name: "@r/app", dependencies: { next: "16.0.0" } },
  "node_modules/next": { version: "16.0.0", integrity: "sha512-n" },
  "node_modules/@img/sharp-darwin-arm64": { version: "1.0.0", optional: true },
};
const hiddenPackages = Object.fromEntries(Object.entries(lockPackages).filter(([key]) => key !== "" && !key.includes("darwin")));

function repo(overrides: Record<string, string | null> = {}) {
  const files: Record<string, string> = {
    "package.json": JSON.stringify(rootManifest),
    "packages/app/package.json": JSON.stringify(appManifest),
    "packages/README.md": "not a workspace",
    "package-lock.json": JSON.stringify({ lockfileVersion: 3, packages: lockPackages }),
    "node_modules/.package-lock.json": JSON.stringify({ lockfileVersion: 3, packages: hiddenPackages }),
  };
  for (const [file, contents] of Object.entries(overrides)) {
    if (contents === null) delete files[file];
    else files[file] = contents;
  }
  return fakeFs(files);
}

describe("satisfiesEngine", () => {
  it.each([
    [">=22", "24.3.0", true],
    [">=22", "v22.0.0", true],
    [">=22", "21.9.9", false],
    [">= 22.6", "22.5.1", false],
    [">=22.6", "22.6.0", true],
    [">=22.6.1", "22.6.2", true],
    [">=22.6.1", "22.6.0", false],
    [">=22.1", "22", false],
  ])("%s with %s → %s", (range, version, expected) => {
    expect(satisfiesEngine(range, version)).toBe(expected);
  });

  it("rejects range forms it cannot evaluate", () => {
    expect(() => satisfiesEngine("^22", "24.0.0")).toThrow(SetupError);
    expect(() => satisfiesEngine("^22", "24.0.0")).toThrow('Unsupported engines.node range "^22"');
  });
});

describe("redactUrl", () => {
  it("masks the password and keeps the rest", () => {
    expect(redactUrl("postgres://postgres:s3cret@127.0.0.1:5432/devmentor")).toBe(
      "postgres://postgres:***@127.0.0.1:5432/devmentor",
    );
  });

  it("leaves a URL without a password unchanged", () => {
    expect(redactUrl("postgres://app@db:5432/devmentor")).toBe("postgres://app@db:5432/devmentor");
  });

  it("never echoes an unparseable value", () => {
    expect(redactUrl("not a url with s3cret")).toBe("<invalid URL>");
  });
});

describe("isPostgresUrl", () => {
  it.each([
    ["postgres://u:p@h:5432/db", true],
    ["postgresql://h/db", true],
    ["mysql://h/db", false],
    ["", false],
    ["nonsense", false],
  ])("%j → %s", (value, expected) => {
    expect(isPostgresUrl(value)).toBe(expected);
  });
});

describe("lockInSync", () => {
  it("is true when the installed tree, lockfile and manifests agree (optional packages may be absent)", () => {
    expect(lockInSync(ROOT, repo())).toBe(true);
  });

  it("is false without npm's hidden lockfile (nothing installed)", () => {
    expect(lockInSync(ROOT, repo({ "node_modules/.package-lock.json": null }))).toBe(false);
  });

  it("is false when an installed package differs from the lockfile", () => {
    const hidden = { ...hiddenPackages, "node_modules/next": { version: "15.0.0", integrity: "sha512-old" } };
    expect(lockInSync(ROOT, repo({ "node_modules/.package-lock.json": JSON.stringify({ packages: hidden }) }))).toBe(false);
  });

  it("is false when a required package is missing from the installed tree", () => {
    const hidden = without(hiddenPackages, "node_modules/next");
    expect(lockInSync(ROOT, repo({ "node_modules/.package-lock.json": JSON.stringify({ packages: hidden }) }))).toBe(false);
  });

  it("is false when the root manifest declares dependencies the lockfile lacks", () => {
    const manifest = { ...rootManifest, devDependencies: { vitest: "^5", tsx: "^4" } };
    expect(lockInSync(ROOT, repo({ "package.json": JSON.stringify(manifest) }))).toBe(false);
  });

  it("is false when a workspace manifest drifts from the lockfile", () => {
    const manifest = { ...appManifest, dependencies: { next: "16.1.0" } };
    expect(lockInSync(ROOT, repo({ "packages/app/package.json": JSON.stringify(manifest) }))).toBe(false);
  });

  it("is false when a new workspace is not in the lockfile yet", () => {
    expect(lockInSync(ROOT, repo({ "packages/new/package.json": JSON.stringify({ name: "@r/new" }) }))).toBe(false);
  });

  it("ignores empty or null dependency maps when comparing manifests", () => {
    const manifest = { ...appManifest, devDependencies: {}, peerDependencies: null };
    expect(lockInSync(ROOT, repo({ "packages/app/package.json": JSON.stringify(manifest) }))).toBe(true);
  });

  it("supports literal workspace paths and manifests without workspaces", () => {
    const literal = { ...rootManifest, workspaces: ["packages/app"] };
    expect(lockInSync(ROOT, repo({ "package.json": JSON.stringify(literal) }))).toBe(true);

    const single = without(rootManifest, "workspaces");
    const lock = { "": { name: "r", devDependencies: { vitest: "^5" } }, "node_modules/next": lockPackages["node_modules/next"] };
    const hidden = { "node_modules/next": lockPackages["node_modules/next"] };
    expect(
      lockInSync(
        ROOT,
        repo({
          "package.json": JSON.stringify(single),
          "package-lock.json": JSON.stringify({ packages: lock }),
          "node_modules/.package-lock.json": JSON.stringify({ packages: hidden }),
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ["a glob it cannot expand", ["packages/**"]],
    ["a nested glob", ["pack*/*"]],
    ["a non-string pattern", [42]],
    ["a non-array value", { packages: ["packages/*"] }],
  ])("is false for %s in workspaces", (_label, workspaces) => {
    expect(lockInSync(ROOT, repo({ "package.json": JSON.stringify({ ...rootManifest, workspaces }) }))).toBe(false);
  });

  it("is false when a file cannot be parsed", () => {
    expect(lockInSync(ROOT, repo({ "package-lock.json": "{ not json" }))).toBe(false);
  });
});

// ── runSetup ────────────────────────────────────────────────────────────────────────────────

const EXAMPLE_URL = "postgres://postgres:postgres@127.0.0.1:5432/devmentor";
const EXAMPLE = `# example\nDATABASE_URL=${EXAMPLE_URL}\nDB_POOL_MAX=10\n`;

/** A ready checkout: engines, .nvmrc, .env.example and an in-sync install. */
function checkout(overrides: Record<string, string | null> = {}) {
  return repo({
    "package.json": JSON.stringify({ ...rootManifest, engines: { node: ">=22" } }),
    ".nvmrc": "24\n",
    ".env.example": EXAMPLE,
    ...overrides,
  });
}

/** Emulates `@next/env` `loadEnvConfig`: precedence order, never overrides a defined variable,
 * skips `.env.local` under NODE_ENV=test, caches until `forceReload`. */
function fakeLoadEnv(fs: ReturnType<typeof fakeFs>, env: Record<string, string | undefined>) {
  let cache: EnvFile[] | undefined;
  return vi.fn(async (_root: string, { forceReload }: { forceReload: boolean }): Promise<EnvFile[]> => {
    if (cache && !forceReload) return cache;
    const names = env.NODE_ENV === "test" ? [".env"] : [".env.production.local", ".env.local", ".env.production", ".env"];
    cache = [];
    for (const name of names) {
      const contents = fs.files.get(path.join(ROOT, name));
      if (contents === undefined) continue;
      const parsed = Object.fromEntries(
        contents
          .split("\n")
          .filter((line) => line.includes("=") && !line.startsWith("#"))
          .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)] as const),
      );
      for (const [key, value] of Object.entries(parsed)) if (env[key] === undefined) env[key] = value;
      cache.push({ path: name, keys: Object.keys(parsed) });
    }
    return cache;
  });
}

function setup(
  fs: ReturnType<typeof fakeFs>,
  { env = {}, exitCodes = {}, nodeVersion = "24.3.0" }: { env?: Record<string, string | undefined>; exitCodes?: Record<string, number>; nodeVersion?: string } = {},
) {
  const lines: string[] = [];
  const run = vi.fn(async (args: string[]) => exitCodes[args.join(" ")] ?? 0);
  const deps: SetupDeps = {
    root: ROOT,
    fs,
    run,
    loadEnv: fakeLoadEnv(fs, env),
    log: { info: (line) => lines.push(line), error: (line) => lines.push(line) },
    nodeVersion,
    env,
  };
  return { deps, run, lines, env, npmCalls: () => run.mock.calls.map(([args]) => args.join(" ")) };
}

describe("runSetup", () => {
  it("sets up a fresh clone: installs, creates .env.local, migrates, prints the next command", async () => {
    const fs = checkout({ "node_modules/.package-lock.json": null });
    const { deps, lines, npmCalls, run } = setup(fs);

    await expect(runSetup(deps)).resolves.toBe(0);

    expect(npmCalls()).toEqual(["install", "run db:migrate"]);
    expect(run).toHaveBeenCalledWith(["install"], { cwd: ROOT });
    expect(fs.files.get(path.join(ROOT, ".env.local"))).toBe(EXAMPLE);
    expect(lines).toEqual([
      "DevMentor setup",
      "  ✔ Node.js 24.3.0 (requires >=22)",
      "  … Installing dependencies (npm install)",
      "  ✔ Dependencies installed",
      "  ✔ .env.local created from .env.example",
      "  ✔ DATABASE_URL → postgres://postgres:***@127.0.0.1:5432/devmentor (from .env.local)",
      "  … Applying pending migrations (npm run db:migrate)",
      "  ✔ Migrations up to date",
      "Done. Next: npm run dev  →  http://localhost:3000",
    ]);
  });

  it("is idempotent: a second run skips install and leaves .env.local byte-for-byte unchanged", async () => {
    const fs = checkout({ "node_modules/.package-lock.json": null });
    await runSetup(setup(fs).deps);
    fs.files.set(path.join(ROOT, "node_modules", ".package-lock.json"), JSON.stringify({ packages: hiddenPackages }));
    const before = fs.files.get(path.join(ROOT, ".env.local"));
    const copy = vi.spyOn(fs, "copyFileSync");

    const second = setup(fs);
    await expect(runSetup(second.deps)).resolves.toBe(0);

    expect(second.npmCalls()).toEqual(["run db:migrate"]);
    expect(copy).not.toHaveBeenCalled();
    expect(fs.files.get(path.join(ROOT, ".env.local"))).toBe(before);
    expect(second.lines).toContain("  ✔ Dependencies up to date (skipped)");
    expect(second.lines).toContain("  ✔ .env.local provides DATABASE_URL (skipped)");
  });

  it("re-installs when the lockfile changed after a pull", async () => {
    const lock = { packages: { ...lockPackages, "node_modules/next": { version: "16.1.0", integrity: "sha512-new" } } };
    const { deps, npmCalls } = setup(checkout({ "package-lock.json": JSON.stringify(lock), ".env.local": EXAMPLE }));

    await expect(runSetup(deps)).resolves.toBe(0);
    expect(npmCalls()).toEqual(["install", "run db:migrate"]);
  });

  it("uses an edited .env.local as is", async () => {
    const edited = "DATABASE_URL=postgres://me:mine@db.local:6543/dev\n";
    const fs = checkout({ ".env.local": edited });
    const { deps, lines } = setup(fs);

    await expect(runSetup(deps)).resolves.toBe(0);
    expect(fs.files.get(path.join(ROOT, ".env.local"))).toBe(edited);
    expect(lines).toContain("  ✔ DATABASE_URL → postgres://me:***@db.local:6543/dev (from .env.local)");
  });

  it("does not create .env.local when DATABASE_URL comes from the shell", async () => {
    const fs = checkout();
    const { deps, lines } = setup(fs, { env: { DATABASE_URL: "postgres://ci:pw@ci-db:5432/devmentor" } });

    await expect(runSetup(deps)).resolves.toBe(0);
    expect(fs.files.has(path.join(ROOT, ".env.local"))).toBe(false);
    expect(lines).toContain("  ✔ DATABASE_URL comes from the environment; .env.local not needed (skipped)");
    expect(lines).toContain("  ✔ DATABASE_URL → postgres://ci:***@ci-db:5432/devmentor (from the environment)");
  });

  it("does not create .env.local when another env file already provides DATABASE_URL", async () => {
    const fs = checkout({ ".env": "DATABASE_URL=postgres://u:p@h:5432/db\n" });
    const { deps, lines } = setup(fs);

    await expect(runSetup(deps)).resolves.toBe(0);
    expect(fs.files.has(path.join(ROOT, ".env.local"))).toBe(false);
    expect(lines).toContain("  ✔ .env provides DATABASE_URL (skipped)");
  });

  it("treats .env.local created concurrently (EEXIST) as already done", async () => {
    const fs = checkout();
    vi.spyOn(fs, "copyFileSync").mockImplementation(() => {
      fs.files.set(path.join(ROOT, ".env.local"), "DATABASE_URL=postgres://other:x@h:5432/db\n");
      throw Object.assign(new Error("EEXIST"), { code: "EEXIST" });
    });
    const { deps, lines } = setup(fs);

    await expect(runSetup(deps)).resolves.toBe(0);
    expect(lines).toContain("  ✔ .env.local already exists (skipped)");
    expect(lines).toContain("  ✔ DATABASE_URL → postgres://other:***@h:5432/db (from .env.local)");
  });

  it("accepts a repository without an engines.node requirement", async () => {
    const { deps, lines } = setup(checkout({ "package.json": JSON.stringify(rootManifest), ".env.local": EXAMPLE }));

    await expect(runSetup(deps)).resolves.toBe(0);
    expect(lines).toContain("  ✔ Node.js 24.3.0 (no engines.node requirement)");
  });

  describe("failures stop with exit code 1 and an actionable message", () => {
    it.each([
      ["with the .nvmrc hint", {}, "  ✖ Node.js >=22 required, found 20.11.0. Use the version in .nvmrc (24)."],
      ["without .nvmrc", { ".nvmrc": null }, "  ✖ Node.js >=22 required, found 20.11.0."],
    ])("unsupported Node.js, %s, before installing anything", async (_label, overrides, message) => {
      const { deps, lines, run } = setup(checkout(overrides), { nodeVersion: "20.11.0" });

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(run).not.toHaveBeenCalled();
      expect(lines.slice(-2)).toEqual([message, "Fix the problem above, then re-run: npm run setup"]);
    });

    it("npm install failing", async () => {
      const { deps, lines, npmCalls } = setup(checkout({ "node_modules/.package-lock.json": null }), { exitCodes: { install: 1 } });

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(npmCalls()).toEqual(["install"]);
      expect(lines).toContain("  ✖ npm install failed with exit code 1; see the npm output above.");
    });

    it(".env.example missing", async () => {
      const { deps, lines } = setup(checkout({ ".env.example": null }));

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(lines).toContain("  ✖ .env.example is missing; restore it with: git checkout -- .env.example");
    });

    it("copying .env.example failing for another reason", async () => {
      const fs = checkout();
      vi.spyOn(fs, "copyFileSync").mockImplementation(() => {
        throw Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" });
      });
      const { deps, lines } = setup(fs);

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(lines).toContain("  ✖ Unexpected error: EACCES: permission denied");
    });

    it("a non-Error thrown by a dependency", async () => {
      const { deps, lines } = setup(checkout({ ".env.local": EXAMPLE }));
      deps.run = async () => {
        throw "spawn failed";
      };

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(lines).toContain("  ✖ Unexpected error: spawn failed");
    });

    it("an existing .env.local without DATABASE_URL (left untouched)", async () => {
      const fs = checkout({ ".env.local": "DB_DEBUG=true\n" });
      const { deps, lines, run } = setup(fs);

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(fs.files.get(path.join(ROOT, ".env.local"))).toBe("DB_DEBUG=true\n");
      expect(run).not.toHaveBeenCalled();
      expect(lines).toContain("  ✖ DATABASE_URL is not set. Set it in .env.local (see .env.example).");
    });

    it("NODE_ENV=test, which makes @next/env ignore .env.local", async () => {
      const { deps, lines } = setup(checkout({ ".env.local": EXAMPLE }), { env: { NODE_ENV: "test" } });

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(lines.join("\n")).toContain("NODE_ENV=test makes @next/env ignore .env.local");
    });

    it("an empty DATABASE_URL in the environment", async () => {
      const { deps, lines } = setup(checkout(), { env: { DATABASE_URL: "" } });

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(lines).toContain("  ✖ DATABASE_URL is not set. Set it in the environment (see .env.example).");
    });

    it("a DATABASE_URL that is not a postgres:// URL, without running migrations", async () => {
      const { deps, lines, run } = setup(checkout({ ".env.local": "DATABASE_URL=mysql://root:hunter2@h/db\n" }));

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(run).not.toHaveBeenCalled();
      expect(lines).toContain("  ✖ DATABASE_URL from .env.local is not a postgres:// URL (mysql://root:***@h/db). Fix it there.");
    });

    it("migrations failing (database unreachable), with the password redacted", async () => {
      const { deps, lines } = setup(checkout({ ".env.local": "DATABASE_URL=postgres://u:s3cret@127.0.0.1:1/none\n" }), {
        exitCodes: { "run db:migrate": 1 },
      });

      await expect(runSetup(deps)).resolves.toBe(1);
      expect(lines).toContain(
        "  ✖ Migrations failed (exit code 1) for postgres://u:***@127.0.0.1:1/none. " +
          "Start PostgreSQL and create the database if needed, or fix DATABASE_URL in .env.local.",
      );
      expect(lines.join("\n")).not.toContain("s3cret");
    });
  });
});
