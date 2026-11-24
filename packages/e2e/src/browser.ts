import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const CLI = path.join(path.dirname(require.resolve("agent-browser/package.json")), "bin", "agent-browser.js");

interface CliResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface Snapshot {
  /** Accessibility tree as text, e.g. `- heading "Dashboard" [level=1, ref=e1]`. */
  snapshot: string;
  refs: Record<string, { role: string; name?: string }>;
}

/**
 * Thin typed wrapper over the `agent-browser` CLI (Chrome over CDP). Each instance owns an
 * isolated `--session` (its own browser), so test files can run in parallel. Always `close()`.
 *
 * Selectors are CSS selectors, `@eN` refs from {@link snapshot}, or any locator the CLI accepts.
 * For commands without a helper, use {@link run} (`agent-browser --help`).
 */
export class Browser {
  readonly session = `devmentor-e2e-${randomBytes(4).toString("hex")}`;

  constructor(readonly baseUrl: string) {}

  /** Runs `agent-browser --session <s> --json <args…>` and returns `data`; throws on failure. */
  run<T = Record<string, unknown>>(...args: string[]): Promise<T> {
    return new Promise((resolve, reject) => {
      execFile(
        process.execPath,
        [CLI, "--session", this.session, "--json", ...args],
        { timeout: 45_000, maxBuffer: 16 * 1024 * 1024 },
        (error, stdout, stderr) => {
          let response: CliResponse<T> | undefined;
          try {
            response = JSON.parse(stdout) as CliResponse<T>;
          } catch {
            // Not JSON (e.g. the CLI crashed): fall through with the raw output.
          }
          if (response?.success) resolve(response.data);
          else reject(new Error(`agent-browser ${args.join(" ")}: ${response?.error ?? error?.message ?? stderr}`));
        },
      );
    });
  }

  /** Opens a path relative to the app (`/backend`) or an absolute URL. */
  async open(pathOrUrl: string): Promise<void> {
    await this.run("open", new URL(pathOrUrl, this.baseUrl).toString());
  }

  async text(selector: string): Promise<string> {
    return (await this.run<{ text: string }>("get", "text", selector)).text;
  }

  async attr(selector: string, name: string): Promise<string | null> {
    return (await this.run<{ value: string | null }>("get", "attr", selector, name)).value;
  }

  async count(selector: string): Promise<number> {
    return (await this.run<{ count: number }>("get", "count", selector)).count;
  }

  async title(): Promise<string> {
    return (await this.run<{ title: string }>("get", "title")).title;
  }

  /** Current URL path (`/backend`), resolved against the app's base URL. */
  async pathname(): Promise<string> {
    return new URL((await this.run<{ url: string }>("get", "url")).url).pathname;
  }

  /** Text of the `index`-th (0-based) element matching a CSS selector. */
  async nthText(index: number, selector: string): Promise<string> {
    return (await this.run<{ text: string }>("find", "nth", String(index), selector, "text")).text;
  }

  async click(selector: string): Promise<void> {
    await this.run("click", selector);
  }

  /** Clicks the element with this ARIA role and exact accessible name (e.g. a link "Backend"). */
  async clickByRole(role: string, name: string): Promise<void> {
    await this.run("find", "role", role, "click", "--name", name, "--exact");
  }

  async waitForText(text: string): Promise<void> {
    await this.run("wait", "--text", text);
  }

  /** Waits until the URL matches a glob (`*` within a segment, `**` across segments). */
  async waitForUrl(pattern: string): Promise<void> {
    await this.run("wait", "--url", pattern);
  }

  async snapshot(...flags: string[]): Promise<Snapshot> {
    return this.run<Snapshot>("snapshot", ...flags);
  }

  /** Uncaught page errors since the last call (hydration errors, exceptions). */
  async pageErrors(): Promise<unknown[]> {
    const data = await this.run<{ errors?: unknown[] }>("errors");
    return data.errors ?? [];
  }

  async close(): Promise<void> {
    await this.run("close").catch(() => undefined);
  }
}
