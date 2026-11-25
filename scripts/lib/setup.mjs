// `npm run setup`: steps and helpers. Spec: .ai/specs/2026-11-25-npm-run-setup-installer.md
//
// Runs before `npm install`, so this module imports Node.js built-ins only and keeps to syntax
// that old Node.js versions parse; that way the version check below can report a clear error.
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

/** An expected, user-fixable failure: printed without a stack trace. */
export class SetupError extends Error {}

/**
 * @typedef {object} SetupFs
 * @property {(file: string) => boolean} existsSync
 * @property {(file: string, encoding: "utf8") => string} readFileSync
 * @property {(src: string, dest: string, mode: number) => void} copyFileSync
 * @property {(dir: string) => string[]} readdirSync
 */

/**
 * Whether `version` satisfies an `engines.node` range. Only `>=X[.Y[.Z]]` is supported; other
 * forms throw so an unsupported range in `package.json` surfaces instead of passing silently.
 * @param {string} range
 * @param {string} version e.g. `24.3.0` or `v24.3.0`
 * @returns {boolean}
 */
export function satisfiesEngine(range, version) {
  const match = /^>=\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(range.trim());
  if (!match) {
    throw new SetupError(`Unsupported engines.node range "${range}" in package.json (expected ">=X[.Y[.Z]]").`);
  }
  const wanted = match.slice(1, 4).map((part) => Number(part ?? 0));
  const actual = version.replace(/^v/, "").split(".").map(Number);
  for (const [i, want] of wanted.entries()) {
    const have = actual[i] ?? 0;
    if (have !== want) return have > want;
  }
  return true;
}

/**
 * A connection string safe to print: the password is replaced with `***`. Invalid input is never
 * echoed, because it may still contain a secret.
 * @param {string} value
 * @returns {string}
 */
export function redactUrl(value) {
  try {
    const url = new URL(value);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "<invalid URL>";
  }
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isPostgresUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "postgres:" || protocol === "postgresql:";
  } catch {
    return false;
  }
}

/**
 * @param {SetupFs} fs
 * @param {string} file
 * @returns {any} parsed JSON (shape checked by the caller)
 */
function readJson(fs, file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const MANIFEST_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

/**
 * The dependency maps of a manifest or lockfile entry, ignoring empty ones.
 * @param {Record<string, unknown>} entry
 */
function dependencyMaps(entry) {
  return Object.fromEntries(
    MANIFEST_FIELDS.filter((field) => {
      const value = entry[field];
      return typeof value === "object" && value !== null && Object.keys(value).length > 0;
    }).map((field) => [field, entry[field]]),
  );
}

/**
 * Workspace directories (repo-relative) declared by the root manifest. Supports `dir` and `dir/*`.
 * @param {SetupFs} fs
 * @param {string} root
 * @param {unknown} patterns
 * @returns {string[] | null} `null` when a pattern is not supported
 */
function workspaceDirs(fs, root, patterns) {
  if (patterns === undefined) return [];
  if (!Array.isArray(patterns)) return null;
  /** @type {string[]} */
  const dirs = [];
  for (const pattern of patterns) {
    if (typeof pattern !== "string") return null;
    if (pattern.endsWith("/*") && !pattern.slice(0, -2).includes("*")) {
      const parent = pattern.slice(0, -2);
      for (const name of fs.readdirSync(path.join(root, parent))) {
        if (fs.existsSync(path.join(root, parent, name, "package.json"))) dirs.push(`${parent}/${name}`);
      }
    } else if (!pattern.includes("*")) {
      dirs.push(pattern);
    } else {
      return null;
    }
  }
  return dirs;
}

/**
 * Whether the installed tree matches `package-lock.json` and the lockfile matches every manifest,
 * judged by content (never by file times). Any doubt answers `false`: an unneeded `npm install`
 * is cheap, a skipped needed one leaves a broken tree.
 *
 * 1. npm's hidden lockfile (`node_modules/.package-lock.json`) exists;
 * 2. each of its entries equals the same entry in `package-lock.json`;
 * 3. every lockfile entry it lacks is `optional` (e.g. other platforms' binaries);
 * 4. the root and each workspace manifest declare the same dependency maps as the lockfile.
 * @param {string} root
 * @param {SetupFs} fs
 * @returns {boolean}
 */
export function lockInSync(root, fs) {
  try {
    const lockPackages = readJson(fs, path.join(root, "package-lock.json")).packages;
    const hiddenPackages = readJson(fs, path.join(root, "node_modules", ".package-lock.json")).packages;
    for (const [key, entry] of Object.entries(hiddenPackages)) {
      if (!isDeepStrictEqual(entry, lockPackages[key])) return false;
    }
    for (const [key, entry] of Object.entries(lockPackages)) {
      if (key !== "" && !(key in hiddenPackages) && !entry.optional) return false;
    }
    const rootManifest = readJson(fs, path.join(root, "package.json"));
    const dirs = workspaceDirs(fs, root, rootManifest.workspaces);
    if (dirs === null) return false;
    for (const [key, manifest] of [
      ["", rootManifest],
      ...dirs.map((dir) => [dir, readJson(fs, path.join(root, dir, "package.json"))]),
    ]) {
      const entry = lockPackages[key];
      if (entry === undefined || !isDeepStrictEqual(dependencyMaps(manifest), dependencyMaps(entry))) return false;
    }
    return true;
  } catch {
    return false;
  }
}
