# `npm run setup` installer (issue #4)

Goals:
- One idempotent command, `npm run setup`, that runs the README "Getting started" steps and skips the ones already done
- README documents it, keeping the manual steps as the alternative
- 100 % unit-test coverage kept; lint, typecheck and build green

Spec: [2026-11-25-npm-run-setup-installer](../specs/implemented/2026-11-25-npm-run-setup-installer.md)
Status: done

This file is both the task journal (AGENTS.md: entries below `---`, append-only) and the execution
plan of the `om-auto-create-pr` run (this header, kept current).

Source doc: .ai/specs/implemented/2026-11-25-npm-run-setup-installer.md

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

- [x] 1.1 Tooling for root scripts — f73102e
- [x] 1.2 Pure helpers — 759edd4
- [x] 1.3 Steps and orchestrator — c7da5b1
- [x] 1.4 Adapters and entry — bca29bc
- [x] 1.5 Docs — 1fcf7b8
- [x] 1.6 Manual verification — 907d890
- [x] 1.7 Archive the Delta — 907d890

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

## 2026-11-25 (1.5 docs)
- Covers: README Getting started leads with `npm run setup` (what it does, re-run safety, the database must exist), keeps the four commands as "Manual setup", adds the command row and `scripts/` to the layout; `AGENTS.md` command row, `scripts/` layout note, coverage-gate scope; `BACKWARD_COMPATIBILITY.md` §5 lists `setup`.
- Remaining: 1.6 manual verification, 1.7 Delta archive (+ spec move to `implemented/`).

## 2026-11-25 (1.6 verification, 1.7 delta archive)
- Covers: Delta archived into `.ai/specs/capabilities/developer-setup.md` (4 requirements, 8 scenarios); `capabilities/` documented in `.ai/specs/README.md` and the `AGENTS.md` `.ai/` tree; spec moved to `implemented/` with links updated in this header.
- Verified (1.6) on a throwaway database `devmentor_setup_*`, dropped afterwards: (a) fresh worktree without `node_modules`/`.env.local` → real `npm install`, `.env.local` copied, migrations applied, exit 0, 9 s; (b) re-run → install and env skipped, `.env.local` byte-identical, exit 0, <1 s; (c) unreachable URL → exit 1, password absent from all output.
- Remaining: full validation gate, `om-auto-review-pr`.

## 2026-11-25 (progress, validation gate)
- Covers: Progress for steps 1.1–1.7 marked done with their commit SHAs.
- Verified: full gate in the worktree: `npm run lint` ok, `npm run typecheck` ok, `npm run test:coverage` 100 % (259 statements / 129 branches / 73 functions / 233 lines, 29 files), `npm run build` ok. `test:integration` not run: no UI, route, API or schema change (AGENTS.md trigger); CI runs it.
- Remaining: `om-auto-review-pr` pass, summary comment, ready flip.

## 2026-11-25 (CI fix: NODE_ENV in the loadEnvFiles test)
- Covers: the `Unit tests` CI job was red on `c0543ff` (1 of 144 tests). `loadEnvFiles` test now pins `NODE_ENV=development` with `vi.stubEnv`; lesson `2026-11-25-ci-tests-run-with-node-env-test` added.
- Decisions/pitfalls: cause confirmed by reproduction: `env -u NODE_ENV` fails (same assertion as the CI log), `NODE_ENV=development` passes. The earlier entries' "gate green" was true only for the sandbox's `NODE_ENV=development`; it did not cover CI's environment. The test was wrong, `npm run setup` itself is unaffected (it runs without `NODE_ENV=test`). With `NODE_ENV=production` 22 `unit-dom` tests fail on `main` as well; unrelated, left alone.
- Verified: 144/144 under unset, `development` and `test`; `env -u NODE_ENV npm run test:coverage` 100 % (259/129/73/233); ESLint and `tsc` clean.
- Remaining: green CI on the new commit, formal review, draft → ready, release locks.

## 2026-11-25 (review fixes: query-string password, non-npm managers)
- Covers: findings of the first `om-auto-review-pr` pass on #6. Major: `redactUrl` now also masks query parameters whose name contains "pass" (`?password=`, `?sslpassword=`); `pg` accepts a password there, so it was printed verbatim. Minor: `npmCommand` uses `npm_execpath` only when it is npm's CLI (`npm-cli.*`), so `pnpm run setup` / `yarn setup` no longer install with another manager and create a foreign lockfile. Nits: overclaiming Node-version comment removed, `AGENTS.md` line wrap fixed.
- Decisions/pitfalls: tests written first and seen red (8 failing), then green. The stricter guard broke the tests' fake npm, named `fake-npm.cjs`; it is now `npm-cli.cjs` like the real file. GitHub refuses "request changes" on one's own PR (same account), so the review was posted as a review comment with the verdict in its text and the `changes-requested` label.
- Verified: 154 tests under unset, `development` and `test` NODE_ENV; `env -u NODE_ENV npm run test:coverage` 100 % (263/133/73/236); lint, typecheck, build pass; real `npm run setup` with `?password=…` in an unreachable URL: exit 1, the password appears 0 times, and the real `npm_execpath` (`…/npm/bin/npm-cli.js`) passes the new guard.
- Remaining: green CI on this commit, re-review, draft → ready, release locks.

## 2026-11-25 (re-review, ready)
- Covers: re-review of `f2c3a09` after the fixes: both findings resolved (query-string password redacted, non-npm managers ignored), no new findings; verdict approve. Header status set to `done`: all plan steps are complete and CI is green; the merge itself is the maintainer's.
- Decisions/pitfalls: GitHub refuses an approval from the PR's own author, so the re-review is again a review comment with the verdict in its text (label `merge-queue`, which is routing, not a merge). `automerge.mode` is `prepare-to-merge` and no `automerge` label is set, so nothing merges by itself. Merge order for the maintainer: PR #5 (spec), then PR #6.
- Verified: CI green on `f2c3a09` (lint, typecheck, unit 100 %, build, integration).
- Remaining: maintainer merges #5, then #6; closing #4 happens through `Closes #4` on merge.
