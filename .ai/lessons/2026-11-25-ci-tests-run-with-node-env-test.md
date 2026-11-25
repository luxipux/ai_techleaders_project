# Unit tests run with `NODE_ENV=test` in CI, but `development` in the sandbox

## Context
The `npm run setup` PR passed lint, typecheck, `test:coverage` (100 %) and build in the sandbox, yet
the `Unit tests` CI job failed on one test (`scripts/lib/adapters.test.ts` → `loadEnvFiles`: expected
`.env.local` to be loaded, got `[]`).

## Finding
- The sandbox exports `NODE_ENV=development`. In CI it is unset, and Vitest then sets
  `NODE_ENV=test` for the run.
- `@next/env` `loadEnvConfig` ignores `.env.local` when `NODE_ENV=test` (it is the one env file Next.js
  skips in test mode). Any test that reads real env files through it passes in the sandbox and fails in CI.
- Reproduce CI locally with `env -u NODE_ENV npx vitest run` (or `NODE_ENV=test`).

## Lesson / How to apply
- Before pushing, run the unit suite once with `env -u NODE_ENV npm run test:coverage`; a green run
  in the sandbox alone does not prove the CI job is green.
- A test that depends on `NODE_ENV` pins it with `vi.stubEnv("NODE_ENV", "development")` (the value the
  real command runs under); `unstubEnvs: true` in `vitest.config.ts` restores it.
- Do not report "gate green" from the sandbox without saying which `NODE_ENV` it ran under.
- Separate, pre-existing: with `NODE_ENV=production` 22 `unit-dom` tests fail on `main` too; CI does
  not use that value.

Related: [NODE_ENV and `next build`](2026-11-24-next-build-requires-production-node-env.md),
[run journal](../runs/2026-11-25-npm-run-setup-installer.md)
