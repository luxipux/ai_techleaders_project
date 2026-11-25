import path from "node:path";

import { describe, expect, it } from "vitest";

import { isPostgresUrl, lockInSync, redactUrl, satisfiesEngine, SetupError, type SetupFs } from "./setup.mjs";

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
