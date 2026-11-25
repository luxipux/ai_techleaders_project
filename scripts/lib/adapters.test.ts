import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultDeps, loadEnvFiles, npmCommand, repoRoot, runNpm } from "./adapters.mjs";

let dir: string;
/** A stand-in for the npm CLI: exits with the code in its first argument (or kills itself). */
let fakeNpm: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "devmentor-setup-"));
  fakeNpm = path.join(dir, "fake-npm.cjs");
  fs.writeFileSync(
    fakeNpm,
    'if (process.argv[2] === "kill") process.kill(process.pid, "SIGKILL"); else process.exit(Number(process.argv[2]));\n',
  );
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("npmCommand", () => {
  it("runs the npm CLI that started `npm run setup` with this Node.js binary", () => {
    expect(npmCommand(["install"], { npm_execpath: "/npm/bin/npm-cli.js" }, "linux")).toEqual({
      command: process.execPath,
      args: ["/npm/bin/npm-cli.js", "install"],
      shell: false,
    });
  });

  it("falls back to npm from PATH", () => {
    expect(npmCommand(["install"], {}, "linux")).toEqual({ command: "npm", args: ["install"], shell: false });
  });

  it("uses npm.cmd through a shell on Windows", () => {
    expect(npmCommand(["run", "db:migrate"], {}, "win32")).toEqual({ command: "npm.cmd run db:migrate", args: [], shell: true });
  });
});

describe("runNpm", () => {
  it("resolves the exit code of the npm process", async () => {
    await expect(runNpm(["3"], { cwd: dir, env: { npm_execpath: fakeNpm }, platform: "linux" })).resolves.toBe(3);
  });

  it("uses process.env and the current platform by default", async () => {
    vi.stubEnv("npm_execpath", fakeNpm);
    await expect(runNpm(["0"], { cwd: dir })).resolves.toBe(0);
  });

  it("resolves 1 when npm is killed by a signal", async () => {
    await expect(runNpm(["kill"], { cwd: dir, env: { npm_execpath: fakeNpm }, platform: "linux" })).resolves.toBe(1);
  });

  it("rejects when the process cannot be started", async () => {
    const missingDir = path.join(dir, "missing");
    await expect(runNpm(["0"], { cwd: missingDir, env: { npm_execpath: fakeNpm }, platform: "linux" })).rejects.toThrow(/ENOENT/);
  });
});

describe("loadEnvFiles", () => {
  it("loads env files like the MikroORM CLI, reporting files in precedence order and caching until forceReload", async () => {
    // Vitest sets NODE_ENV=test when it is unset (CI), and `@next/env` skips `.env.local` in test
    // mode; the sandbox exports `development`. Pin the value `npm run setup` really runs under.
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEVMENTOR_SETUP_A", undefined);
    vi.stubEnv("DEVMENTOR_SETUP_B", undefined);
    fs.writeFileSync(path.join(dir, ".env.local"), "DEVMENTOR_SETUP_A=from-local\n");

    await expect(loadEnvFiles(dir, { forceReload: true })).resolves.toEqual([{ path: ".env.local", keys: ["DEVMENTOR_SETUP_A"] }]);
    expect(process.env.DEVMENTOR_SETUP_A).toBe("from-local");

    fs.writeFileSync(path.join(dir, ".env"), "DEVMENTOR_SETUP_A=from-env\nDEVMENTOR_SETUP_B=b\n");
    await expect(loadEnvFiles(dir, { forceReload: false })).resolves.toEqual([{ path: ".env.local", keys: ["DEVMENTOR_SETUP_A"] }]);

    await expect(loadEnvFiles(dir, { forceReload: true })).resolves.toEqual([
      { path: ".env.local", keys: ["DEVMENTOR_SETUP_A"] },
      { path: ".env", keys: ["DEVMENTOR_SETUP_A", "DEVMENTOR_SETUP_B"] },
    ]);
    expect(process.env.DEVMENTOR_SETUP_A).toBe("from-local");
    expect(process.env.DEVMENTOR_SETUP_B).toBe("b");
  });
});

describe("createDefaultDeps", () => {
  it("wires the real filesystem, npm, env loader and console", async () => {
    const deps = createDefaultDeps();

    expect(fs.existsSync(path.join(deps.root, "package.json"))).toBe(true);
    expect(deps.root).toBe(repoRoot);
    expect(deps.fs.existsSync).toBe(fs.existsSync);
    expect(deps.loadEnv).toBe(loadEnvFiles);
    expect(deps.env).toBe(process.env);
    expect(deps.nodeVersion).toBe(process.versions.node);

    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    deps.log.info("hello");
    deps.log.error("oops");
    expect(info).toHaveBeenCalledWith("hello");
    expect(error).toHaveBeenCalledWith("oops");

    vi.stubEnv("npm_execpath", fakeNpm);
    await expect(deps.run(["5"], { cwd: dir })).resolves.toBe(5);
  });
});
