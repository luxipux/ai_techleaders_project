import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";

import { appDir, repoRoot } from "./paths";

export interface AppServer {
  baseUrl: string;
  stop(): Promise<void>;
}

const STARTUP_TIMEOUT_MS = 60_000;

/** Starts the production build (`next start`) against `databaseUrl` and waits until it is healthy. */
export async function startAppServer(databaseUrl: string): Promise<AppServer> {
  if (!existsSync(path.join(appDir, ".next", "BUILD_ID"))) {
    throw new Error("No production build found. Run `npm run test:integration` (it builds first) or `npm run build`.");
  }

  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(
    "npm",
    ["run", "start", "-w", "@devmentor/app", "--", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      // Own process group, so stop() also kills `next start` behind the npm wrapper.
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, DATABASE_URL: databaseUrl, NEXT_TELEMETRY_DISABLED: "1" },
    },
  );

  let logs = "";
  child.stdout.on("data", (chunk: Buffer) => (logs += chunk));
  child.stderr.on("data", (chunk: Buffer) => (logs += chunk));
  const exited = new Promise<never>((_, reject) =>
    child.once("exit", (code) => reject(new Error(`App server exited early (${code}):\n${logs}`))),
  );

  const stop = async () => {
    if (child.exitCode !== null || child.pid === undefined) return;
    const done = new Promise((resolve) => child.once("exit", resolve));
    process.kill(-child.pid, "SIGTERM");
    await done;
  };

  try {
    await Promise.race([waitForHealthy(baseUrl), exited]);
  } catch (error) {
    await stop();
    throw error;
  }
  if (process.env.E2E_DEBUG) console.log(`[e2e] app server ready at ${baseUrl}`);
  return { baseUrl, stop };
}

async function waitForHealthy(baseUrl: string): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let last = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
      last = `${response.status} ${await response.text()}`;
    } catch (error) {
      last = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`App server at ${baseUrl} did not become healthy within ${STARTUP_TIMEOUT_MS} ms (last: ${last})`);
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => (typeof address === "object" && address ? resolve(address.port) : reject(new Error("no port"))));
    });
  });
}
