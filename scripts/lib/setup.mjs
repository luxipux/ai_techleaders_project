// `npm run setup`: steps and helpers. Spec: .ai/specs/2026-11-25-npm-run-setup-installer.md
//
// Runs before `npm install`, so this module imports Node.js built-ins only and keeps to syntax
// that old Node.js versions parse; that way the version check below can report a clear error.
import { constants } from "node:fs";
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
 * An env file `@next/env` loaded, in precedence order (the first one defining a key wins).
 * @typedef {object} EnvFile
 * @property {string} path repo-relative, e.g. `.env.local`
 * @property {string[]} keys
 */

/**
 * Everything `runSetup` touches, injected so tests need no real npm, database or files.
 * @typedef {object} SetupDeps
 * @property {string} root repository root
 * @property {SetupFs} fs
 * @property {(args: string[], options: { cwd: string }) => Promise<number>} run runs `npm <args>`, resolves its exit code
 * @property {(root: string, options: { forceReload: boolean }) => Promise<EnvFile[]>} loadEnv loads env files into `env`
 * @property {{ info: (message: string) => void, error: (message: string) => void }} log
 * @property {string} nodeVersion
 * @property {Record<string, string | undefined>} env the process environment
 */

const ENV_LOCAL = ".env.local";
const ENV_EXAMPLE = ".env.example";

/**
 * Runs the README "Getting started" steps, skipping those already done. The first failing step
 * stops the run; nothing is rolled back because every step is safe to repeat.
 * @param {SetupDeps} deps
 * @returns {Promise<number>} process exit code
 */
export async function runSetup(deps) {
  deps.log.info("DevMentor setup");
  try {
    checkNode(deps);
    await installDependencies(deps);
    const source = await ensureEnvFile(deps);
    const databaseUrl = checkDatabaseUrl(deps, source);
    await applyMigrations(deps, databaseUrl, source);
  } catch (error) {
    const message = error instanceof SetupError ? error.message : `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
    deps.log.error(`  ✖ ${message}`);
    deps.log.error("Fix the problem above, then re-run: npm run setup");
    return 1;
  }
  deps.log.info("Done. Next: npm run dev  →  http://localhost:3000");
  return 0;
}

/** @param {SetupDeps} deps */
function checkNode({ root, fs, log, nodeVersion }) {
  const range = readJson(fs, path.join(root, "package.json")).engines?.node;
  if (typeof range !== "string") {
    log.info(`  ✔ Node.js ${nodeVersion} (no engines.node requirement)`);
    return;
  }
  if (!satisfiesEngine(range, nodeVersion)) {
    const nvmrc = path.join(root, ".nvmrc");
    const hint = fs.existsSync(nvmrc) ? ` Use the version in .nvmrc (${fs.readFileSync(nvmrc, "utf8").trim()}).` : "";
    throw new SetupError(`Node.js ${range} required, found ${nodeVersion}.${hint}`);
  }
  log.info(`  ✔ Node.js ${nodeVersion} (requires ${range})`);
}

/** @param {SetupDeps} deps */
async function installDependencies({ root, fs, run, log }) {
  if (lockInSync(root, fs)) {
    log.info("  ✔ Dependencies up to date (skipped)");
    return;
  }
  log.info("  … Installing dependencies (npm install)");
  const code = await run(["install"], { cwd: root });
  if (code !== 0) throw new SetupError(`npm install failed with exit code ${code}; see the npm output above.`);
  log.info("  ✔ Dependencies installed");
}

/**
 * Makes sure `DATABASE_URL` has a source, creating `.env.local` from `.env.example` only when
 * nothing provides it and `.env.local` does not exist. Never edits an existing file, and never
 * creates one that would shadow a value from the environment or another env file.
 * @param {SetupDeps} deps
 * @returns {Promise<string>} where `DATABASE_URL` comes from, or the file to set it in
 */
async function ensureEnvFile({ root, fs, env, loadEnv, log }) {
  // `@next/env` never overrides a variable that is already defined, even an empty one.
  if (env.DATABASE_URL !== undefined) {
    log.info(`  ✔ DATABASE_URL comes from the environment; ${ENV_LOCAL} not needed (skipped)`);
    return "the environment";
  }
  const provider = (await loadEnv(root, { forceReload: false })).find((file) => file.keys.includes("DATABASE_URL"));
  if (provider) {
    log.info(`  ✔ ${provider.path} provides DATABASE_URL (skipped)`);
    return provider.path;
  }
  if (fs.existsSync(path.join(root, ENV_LOCAL))) {
    log.info(`  ✔ ${ENV_LOCAL} exists (skipped)`);
    return ENV_LOCAL;
  }
  const example = path.join(root, ENV_EXAMPLE);
  if (!fs.existsSync(example)) {
    throw new SetupError(`${ENV_EXAMPLE} is missing; restore it with: git checkout -- ${ENV_EXAMPLE}`);
  }
  try {
    fs.copyFileSync(example, path.join(root, ENV_LOCAL), constants.COPYFILE_EXCL);
    log.info(`  ✔ ${ENV_LOCAL} created from ${ENV_EXAMPLE}`);
  } catch (error) {
    // Another process created it between the check and the copy: keep that file.
    if (/** @type {{ code?: unknown }} */ (error).code !== "EEXIST") throw error;
    log.info(`  ✔ ${ENV_LOCAL} already exists (skipped)`);
  }
  // `loadEnvConfig` caches its first result; reload so the new file is read.
  await loadEnv(root, { forceReload: true });
  return ENV_LOCAL;
}

/**
 * @param {SetupDeps} deps
 * @param {string} source
 * @returns {string} the validated connection string
 */
function checkDatabaseUrl({ env, log }, source) {
  const value = env.DATABASE_URL;
  if (!value) {
    const testNote =
      env.NODE_ENV === "test" ? " NODE_ENV=test makes @next/env ignore .env.local: unset NODE_ENV or export DATABASE_URL." : "";
    throw new SetupError(`DATABASE_URL is not set. Set it in ${source} (see ${ENV_EXAMPLE}).${testNote}`);
  }
  if (!isPostgresUrl(value)) {
    throw new SetupError(`DATABASE_URL from ${source} is not a postgres:// URL (${redactUrl(value)}). Fix it there.`);
  }
  log.info(`  ✔ DATABASE_URL → ${redactUrl(value)} (from ${source})`);
  return value;
}

/**
 * MikroORM records applied migrations and applies only pending ones, so this step is safe to
 * repeat; its exit code is the contract (its table output is not parsed).
 * @param {SetupDeps} deps
 * @param {string} databaseUrl
 * @param {string} source
 */
async function applyMigrations({ root, run, log }, databaseUrl, source) {
  log.info("  … Applying pending migrations (npm run db:migrate)");
  const code = await run(["run", "db:migrate"], { cwd: root });
  if (code !== 0) {
    throw new SetupError(
      `Migrations failed (exit code ${code}) for ${redactUrl(databaseUrl)}. ` +
        `Start PostgreSQL and create the database if needed, or fix DATABASE_URL in ${source}.`,
    );
  }
  log.info("  ✔ Migrations up to date");
}

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
