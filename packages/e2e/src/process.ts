import { spawn, type SpawnOptions } from "node:child_process";

/** Runs a command to completion; rejects with its combined output on a non-zero exit. */
export function run(command: string, args: string[], options: SpawnOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => (output += chunk));
    child.stderr?.on("data", (chunk: Buffer) => (output += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`\`${command} ${args.join(" ")}\` exited with ${code}:\n${output}`));
    });
  });
}
