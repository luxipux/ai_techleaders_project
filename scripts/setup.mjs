// `npm run setup`: one-command, idempotent developer setup (README → Getting started).
// Safe to re-run at any time: every step skips work that is already done.
import { main } from "./lib/setup.mjs";

process.exitCode = await main();
