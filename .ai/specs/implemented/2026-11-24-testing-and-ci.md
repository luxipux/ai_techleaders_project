# Testing frameworks + GitHub CI

## Goal / problem

The monorepo has no automated checks. Every pull request should prove that the code lints,
type-checks, builds, is fully unit-tested, and works end-to-end against a real PostgreSQL.

## Scope & non-goals

In scope:
- GitHub Actions workflow on every pull request (and pushes to `main`): lint, typecheck, build,
  unit tests with a 100 % coverage gate, integration tests.
- Unit test framework for TypeScript: **Vitest** (+ `@vitest/coverage-v8`, Testing Library + jsdom
  for React components).
- Integration framework in a new workspace `packages/e2e` (`@devmentor/e2e`): ephemeral
  PostgreSQL via **testcontainers**, migrations through the MikroORM CLI, the production build
  started with `next start`, browser tests driven by **agent-browser** (Vercel's CLI, Chrome/CDP).
- AGENTS.md rule: every new feature must ship with unit tests at 100 % coverage.
- Unit tests that bring the existing code to 100 % coverage.

Non-goals: branch-protection settings (repo admin does this in GitHub), deployment, visual
regression testing.

## Design

### Unit tests (Vitest)
- One root `vitest.config.ts` with two projects:
  `unit` (Node env, `packages/{core,db,app,ui}/**/*.test.ts`) and `unit-dom` (jsdom,
  `**/*.test.tsx`). `packages/e2e` is excluded.
- Tests are colocated next to the code (`foo.ts` → `foo.test.ts`).
- Aliases: `@/` → `packages/app/src`; `server-only` → a no-op stub (the real package throws
  outside the React Server bundle).
- Coverage (v8): include `packages/{core,db,app,ui}/src/**` plus `packages/db/mikro-orm.config.ts`
  and `packages/app/next.config.ts`; exclude tests, migrations, `.d.ts`. Thresholds: 100 % for
  statements, branches, functions and lines. The gate fails CI.
- Unit tests never touch a real database or network. They mock `em`, `MikroORM.init`, `next/server`.
- Root scripts: `test`, `test:watch`, `test:coverage`.

### Integration tests (`packages/e2e`)
- Vitest config with a `globalSetup` that:
  1. starts PostgreSQL: `@testcontainers/postgresql` (`postgres:17-alpine`) by default; when
     `E2E_DATABASE_URL` is set (no Docker, e.g. the sandbox), it creates a throwaway database
     `devmentor_e2e_<random>` on that server instead and drops it afterwards;
  2. runs `npm run db:migrate` with that `DATABASE_URL`;
  3. starts the production build (`next start`) on a free port and waits for `/api/health` = 200;
  4. provides `baseUrl` / `databaseUrl` to tests (`inject()`), and tears everything down.
- `Browser` helper wraps the `agent-browser` CLI (`--json`, one isolated `--session` per test file).
- The package is black-box: it must not import other `@devmentor/*` packages (lint rule).
- Root script `test:integration` = `npm run build && npm run test -w @devmentor/e2e`.

### CI (`.github/workflows/ci.yml`)
- Triggers: `pull_request`, `push` to `main`; cancel superseded runs; `contents: read`.
- Jobs (parallel, Node 24, `npm ci` with npm cache): `lint`, `typecheck`, `build`,
  `unit` (`npm run test:coverage`, uploads the coverage report), `integration`
  (`agent-browser install --with-deps`, `npm run test:integration`; Docker is available on
  `ubuntu-latest`).

## Acceptance criteria
- `npm run lint`, `typecheck`, `build`, `test:coverage` (100 %) pass locally.
- `npm run test:integration` passes locally with `E2E_DATABASE_URL`; the testcontainers path runs in CI.
- AGENTS.md documents the testing rules, including mandatory 100 % unit coverage for new code.

## Open questions
- Making the CI jobs *required* checks is a GitHub repository setting (owner's call).
