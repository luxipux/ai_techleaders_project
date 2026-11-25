# `npm run setup` installer (issue #4)

Goals:
- One idempotent command, `npm run setup`, that runs the README "Getting started" steps and skips the ones already done
- README documents it, keeping the manual steps as the alternative
- 100 % unit-test coverage kept; lint, typecheck and build green

Spec: [2026-11-25-npm-run-setup-installer](../specs/2026-11-25-npm-run-setup-installer.md)
Status: in-progress

This file is both the task journal (AGENTS.md: entries below `---`, append-only) and the execution
plan of the `om-auto-create-pr` run (this header, kept current).

Source doc: .ai/specs/2026-11-25-npm-run-setup-installer.md

### Scope
- `scripts/setup.mjs` (entry), `scripts/lib/setup.mjs` (steps, helpers), `scripts/lib/adapters.mjs`
  (fs, npm runner, `@next/env` loader, logger), with colocated `*.test.ts`.
- Root config: `package.json` `setup` script, `tsconfig.json` (`allowJs`/`checkJs`, `scripts`),
  `vitest.config.ts` (unit include and coverage include widened to `scripts/**`).
- Docs: README Getting started and command table, `AGENTS.md`, `BACKWARD_COMPATIBILITY.md` §5,
  capability file `.ai/specs/capabilities/developer-setup.md` with `.ai/specs/README.md`.

### Non-goals
- Starting the dev server, creating the database (spec Q1, Q2), an e2e test (Q4).
- Any change under `packages/*`, the schema, env variables, routes or exports.

### Risks
- npm's hidden lockfile is an internal format; the check falls back to "install" when unsure.
- The branch starts from the spec PR head (`spec/npm-run-setup-installer`), not `main`, so this
  journal is an edit rather than a conflicting add. Merge PR #5 first; the diff then shrinks to the
  implementation.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: `npm run setup`

- [ ] 1.1 Tooling for root scripts
- [ ] 1.2 Pure helpers
- [ ] 1.3 Steps and orchestrator
- [ ] 1.4 Adapters and entry
- [ ] 1.5 Docs
- [ ] 1.6 Manual verification
- [ ] 1.7 Archive the Delta

---

## 2026-11-25 (spec)
- Covers: the spec, written with `om-spec-writing --autonomous` via `om-auto-fix-issue 4` → `om-auto-write-spec`, on a design-only spec PR.
- Decisions/pitfalls: Q1–Q5 resolved with reversible defaults (no dev server, no DB creation, root `scripts/` in `.mjs`, no e2e, never shadow an existing `DATABASE_URL`). Verified in the sandbox: `@next/env` `loadEnvConfig` caches (needs `forceReload` after creating `.env.local`) and ignores `.env.local` under `NODE_ENV=test`; the hidden lockfile matches `package-lock.json` except 124 optional platform packages; `db:migrate` exits 1 with clear errors for a missing or unreachable database. A fresh-context scope review found the spec cohesive; its two Low findings are applied.
- Remaining: implementation PR (`om-auto-implement-spec`), Delta archive into `.ai/specs/capabilities/developer-setup.md`.

## 2026-11-25 (execution plan)
- Covers: implementation run started (`om-auto-implement-spec` → `om-auto-create-pr`, 7 steps, plain engine); this file's header now carries the execution plan and Progress, as the one-file-per-task journal.
- Decisions/pitfalls: branch `feat/npm-run-setup-installer` starts from the spec PR head because a journal added by both PRs is a guaranteed add/add merge conflict (reproduced in a scratch repo); the repo merges with merge commits, so either merge order is then clean.
- Remaining: steps 1.1–1.7.

## 2026-11-25 (1.1 tooling)
- Covers: root `tsconfig.json` type-checks `scripts/` JavaScript (`allowJs`/`checkJs`, root project only); `vitest.config.ts` runs `scripts/**/*.test.ts` and covers `scripts/**/*.mjs` (gate widened).
- Verified: `npm run typecheck` ok, `npm run test:coverage` 100 % (unchanged, no scripts yet).

## 2026-11-25 (1.2 helpers)
- Covers: `scripts/lib/setup.mjs` helpers `satisfiesEngine`, `redactUrl`, `isPostgresUrl`, `lockInSync` (hidden lockfile vs `package-lock.json` vs manifests, by content), with an in-memory fs in `setup.test.ts` (31 tests).
- Decisions/pitfalls: unsupported `engines.node` forms and workspace globs fail closed (throw / "not in sync"); invalid URLs are never echoed. A dead `?? 0` fallback was removed to keep branch coverage real rather than ignored.
- Verified: scripts tests 100 % statements/branches/functions/lines; root `tsc` and ESLint clean.

## 2026-11-25 (1.3 steps and orchestrator)
- Covers: `runSetup(deps)` with the five steps (Node, dependencies, env file, `DATABASE_URL`, migrations); every dependency injected. Tests cover all Delta scenarios (fresh, re-run, lockfile change, edited `.env.local`, value from shell or `.env`) and every failure path, with an `@next/env` emulation (precedence, no override, `NODE_ENV=test`, `forceReload` cache).
- Decisions/pitfalls: an empty `DATABASE_URL` in the shell counts as defined (as in `@next/env`) and fails with "not set"; unexpected errors print their message and exit 1.
- Verified: 50 tests, `scripts/lib/setup.mjs` 100 % statements/branches; root `tsc` and ESLint clean.

## 2026-11-25 (1.4 adapters and entry)
- Covers: `scripts/lib/adapters.mjs` (npm runner via `npm_execpath`, `@next/env` loader, default deps), `main()`, entry `scripts/setup.mjs`, root `"setup": "node scripts/setup.mjs"`; tests on a temp dir with a fake npm script, plus entry and `main` tests with mocked modules.
- Decisions/pitfalls: Windows fallback (no `npm_execpath`) runs `npm.cmd` as one shell command string, avoiding Node's args-with-shell deprecation; removed a custom silent logger for `@next/env` whose callbacks never ran (untestable), keeping the CLI's default console logger.
- Verified: 61 scripts tests, scripts coverage 100 % on all four metrics; `tsc`, ESLint clean; real `npm run setup` with an invalid URL exits 1 before migrations, password redacted.
