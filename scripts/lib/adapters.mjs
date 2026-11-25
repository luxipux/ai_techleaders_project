// Real dependencies for `runSetup` (tests inject fakes instead). Node.js built-ins only, except
// `@next/env`, which is imported lazily because it exists only after `npm install`.
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root (this file lives in `scripts/lib/`). */
export const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

/**
 * How to run npm. Prefer the npm CLI that started `npm run setup` (`npm_execpath`): it is run by
 * this Node.js binary, so no shell is needed on any platform. Otherwise use `npm` from PATH; on
 * Windows that is `npm.cmd`, which Node.js only spawns through a shell.
 * @param {string[]} args fixed, internal arguments (never user input)
 * @param {Record<string, string | undefined>} env
 * @param {string} platform
 * @returns {{ command: string, args: string[], shell: boolean }}
 */
export function npmCommand(args, env, platform) {
  if (env.npm_execpath) return { command: process.execPath, args: [env.npm_execpath, ...args], shell: false };
  if (platform === "win32") return { command: ["npm.cmd", ...args].join(" "), args: [], shell: true };
  return { command: "npm", args, shell: false };
}

/**
 * Runs `npm <args>` with inherited output and resolves its exit code (1 when killed by a signal).
 * @param {string[]} args
 * @param {{ cwd: string, env?: Record<string, string | undefined>, platform?: string }} options
 * @returns {Promise<number>}
 */
export function runNpm(args, { cwd, env = process.env, platform = process.platform }) {
  const npm = npmCommand(args, env, platform);
  return new Promise((resolve, reject) => {
    const child = spawn(npm.command, npm.args, { cwd, env, shell: npm.shell, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

/**
 * Loads env files into `process.env` exactly like the MikroORM CLI does
 * (`packages/db/mikro-orm.config.ts`): same call, same precedence, never overriding a variable
 * that is already set.
 * @param {string} root
 * @param {{ forceReload: boolean }} options `loadEnvConfig` caches its first result
 * @returns {Promise<import("./setup.mjs").EnvFile[]>} in precedence order
 */
export async function loadEnvFiles(root, { forceReload }) {
  // `@next/env` is CommonJS: under ESM only its default export is available.
  const { default: nextEnv } = await import("@next/env");
  // Default logger (console), as in the CLI: a file that fails to parse is reported there.
  const { loadedEnvFiles } = nextEnv.loadEnvConfig(root, false, undefined, forceReload);
  return loadedEnvFiles.map((file) => ({ path: file.path, keys: Object.keys(file.env) }));
}

/** @returns {import("./setup.mjs").SetupDeps} */
export function createDefaultDeps() {
  return {
    root: repoRoot,
    fs,
    run: (args, { cwd }) => runNpm(args, { cwd }),
    loadEnv: loadEnvFiles,
    log: { info: (message) => console.log(message), error: (message) => console.error(message) },
    nodeVersion: process.versions.node,
    env: process.env,
  };
}
