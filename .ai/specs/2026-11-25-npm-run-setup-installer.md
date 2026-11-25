# One-command developer setup (`npm run setup`)

Extends: .ai/specs/implemented/2026-11-24-monorepo-foundation.md

Issue: #4

## 📝 TLDR

Proposed: a contributor gets a working checkout with one command, `npm run setup`. Today they run four
manual steps from the README "Getting started" and keep track of which ones they already did. The
command will check Node, install dependencies, create `.env.local`, check `DATABASE_URL` and apply
migrations. It is **idempotent**: every step first checks whether its work is already done and skips
it, so a second run changes nothing and still exits 0. The manual steps stay in the README as the
alternative.

## 📝 Problem Statement

- Onboarding is four commands (`npm install`, `cp .env.example .env.local`, set `DATABASE_URL`,
  `npm run db:migrate`) plus `npm run dev` (README → Getting started). The steps are order-dependent,
  and missing one surfaces later as an unrelated error. Example: `npm run db:migrate` without
  `DATABASE_URL` fails with `Error: DATABASE_URL is not set. Copy .env.example to .env.local at the repo root.`
- After a `git pull` that changes `package-lock.json` or adds migrations, contributors have to remember
  which steps to repeat. A re-runnable command removes that bookkeeping.
- Evidence: the request in issue #4. No usage data exists; this is a convenience feature.

## 📝 Resolved assumptions (autonomous defaults)

| # | Question | Applied default | Rationale | Confirm? |
|---|---|---|---|---|
| Q1 | Should setup also start the dev server (README's last step)? | **No.** It ends by printing `npm run dev` as the next command. | A blocking server makes the command non-terminating and therefore not re-runnable or scriptable. Printing the command costs one extra step. | reversible |
| Q2 | Should setup create the PostgreSQL database when it does not exist? | **No.** A missing or unreachable database fails with an actionable message. | Smallest scope; creating databases needs server privileges and differs per environment. MikroORM's `database:create` command is the canonical primitive if this is added later. | reversible |
| Q3 | Where does the code live: a root `scripts/` folder or a new workspace package? | **Root `scripts/`**, plain ESM JavaScript (`.mjs`) with JSDoc types, covered by the existing 100 % gate (coverage `include` is widened, never narrowed). | It must run before `npm install`, so it cannot depend on `tsx` or a workspace build. A package would add a manifest and an `exports` contract for one internal script. | reversible |
| Q4 | Add an integration test that runs setup twice against a throwaway database? | **No, deferred.** Unit tests cover every branch through injected adapters. A scripted manual check runs setup twice against a throwaway database and records the output in the run journal. | The e2e harness targets the HTTP app (`next start` + agent-browser). Running `npm install` inside it would make the suite slow and network-dependent. The setup flow has no page, route or schema dependency, which are the AGENTS.md triggers for e2e. | reversible |
| Q5 | `DATABASE_URL` already comes from the shell environment or another env file, and `.env.local` is absent. Should setup still create `.env.local`? | **No.** It reports where `DATABASE_URL` comes from and skips the copy. | Copying `.env.example` would add a second, lower-priority `DATABASE_URL` that can silently shadow `.env` or `.env.production`, because `.env.local` outranks them in `@next/env`. Skipping cannot break a working setup. | reversible |

No assumption weakens security, data scoping or a `BACKWARD_COMPATIBILITY.md` surface, so none needs
confirmation before merge.

## 📝 Proposed Solution

A Node.js script, `scripts/setup.mjs`, run by a new root npm script `"setup": "node scripts/setup.mjs"`.
It executes five steps in order. Each step returns `done` (it changed something) or `skipped` (nothing
to do), or throws a `SetupError` with an actionable message. The first failure stops the run with exit
code 1. Each run starts from the current state, so no step depends on bookkeeping from an earlier run.

| # | Step | "Already done" check | Action when not done |
|---|---|---|---|
| 1 | Node version | `process.versions.node` satisfies `engines.node` from the root `package.json` | Fail: `Node.js >=22 required, found 20.11.0. Use the version in .nvmrc (24).` |
| 2 | Dependencies | The lockfile matches the manifests and the installed tree (see Architecture) | `npm install` |
| 3 | Env file | `DATABASE_URL` is resolvable (environment, then env files) | Copy `.env.example` → `.env.local`, exclusive create only |
| 4 | Database config | `DATABASE_URL` is set and parses as a `postgres:` / `postgresql:` URL | Fail with the file to edit |
| 5 | Migrations | Delegated: MikroORM records applied migrations in `mikro_orm_migrations` and applies only pending ones | `npm run db:migrate` |

Output is one line per step plus a closing hint:

```text
DevMentor setup
  ✔ Node.js 24.3.0 (requires >=22)
  ✔ Dependencies up to date (skipped)
  ✔ .env.local created from .env.example
  ✔ DATABASE_URL → postgres://postgres:***@127.0.0.1:5432/devmentor
  ✔ Migrations applied (npm run db:migrate)
Done. Next: npm run dev  →  http://localhost:3000
```

**Prior art.** Rails `bin/setup` uses `bundle check || bundle install`, copies sample configs only when
they are missing, and runs `db:prepare`. Laravel's `composer setup` copies `.env` only if absent and runs
`migrate`. Both make the check-before-act step idempotent and leave already-applied migrations to the
migrator, which this design adopts. Both also create the database or a secret key; that is out of
scope here (Q2), and DevMentor has no app key.

**Alternatives rejected.**
- A shell script (`setup.sh`): no Windows support, and harder to unit-test to 100 %.
- Always running `npm install`: simpler, but it does not meet the "skip completed steps" requirement,
  and on this repo it re-runs install-script checks and prints warnings on every run.
- Detecting "installed" by file timestamps: here `package-lock.json` (rewritten by `git checkout`) is
  newer than `node_modules/.package-lock.json` although the tree is current, so a timestamp check
  reports stale when it is not.
- Parsing `mikro-orm migration:pending` output to report "skipped": that output is a human-readable
  table and changes with CLI versions, so the exit code of `db:migrate` stays the contract.

## 📝 Delta

### Capability: developer-setup

#### ADDED Requirement: One-command setup
The system SHALL provide `npm run setup` that installs dependencies, ensures a database configuration,
and applies pending migrations, then prints the next command to start the app.

##### Scenario: Fresh clone with a reachable database
- WHEN a contributor runs `npm run setup` in a fresh clone with no `node_modules`, no `.env.local`, no
  `DATABASE_URL` in the environment, and PostgreSQL reachable at the `.env.example` default
- THEN dependencies are installed, `.env.local` is created from `.env.example`, migrations are
  applied, the output ends with `Next: npm run dev`, and the exit code is 0

#### ADDED Requirement: Idempotent re-run
The system SHALL skip every step whose result is already in place, and a run with nothing to do SHALL
change no file and exit 0.

##### Scenario: Second run on a ready checkout
- WHEN `npm run setup` runs again without any change since the previous successful run
- THEN dependencies and `.env.local` are reported as skipped, `npm install` is not invoked,
  `.env.local` is byte-for-byte unchanged, and the exit code is 0

##### Scenario: Lockfile changed after a pull
- WHEN `package-lock.json` or a workspace `package.json` changes so that it no longer matches the
  installed tree
- THEN setup runs `npm install` and reports dependencies as installed

#### ADDED Requirement: Never overwrite local configuration
The system SHALL NOT modify an existing `.env.local`, and SHALL NOT create one when `DATABASE_URL` is
already provided by the environment or another env file.

##### Scenario: Edited `.env.local`
- WHEN `.env.local` exists with a user-edited `DATABASE_URL`
- THEN setup leaves the file untouched and uses that value

##### Scenario: `DATABASE_URL` from the shell
- WHEN `DATABASE_URL` is set in the environment and `.env.local` is absent
- THEN setup does not create `.env.local` and reports that the value comes from the environment

#### ADDED Requirement: Actionable failures without secrets
The system SHALL stop at the first failing step with exit code 1 and a message naming the fix, and
SHALL never print a database password.

##### Scenario: Unsupported Node.js
- WHEN the running Node.js version does not satisfy `engines.node`
- THEN setup exits 1 before installing anything, naming the required and found versions

##### Scenario: Unreachable database
- WHEN migrations fail because the database cannot be reached
- THEN setup exits 1, prints the redacted URL (`postgres://user:***@host:port/db`), and tells the user to
  start PostgreSQL or edit `DATABASE_URL` in the file it came from, then re-run `npm run setup`

##### Scenario: Invalid `DATABASE_URL`
- WHEN `DATABASE_URL` is empty or not a `postgres:`/`postgresql:` URL
- THEN setup exits 1 without running migrations and names the file to edit

## 📝 Architecture

Everything is new code under the repo root. No package changes, and no runtime code in
`packages/*` imports it.

```
scripts/
  setup.mjs            entry: `process.exitCode = await main()` (2 lines)
  lib/setup.mjs        runSetup(deps) + the five steps + helpers (redactUrl, satisfiesEngine, lockInSync)
  lib/adapters.mjs     default deps: fs, child-process runner, env loader, logger
```

- **Before-install constraint.** `npm run setup` must work in a fresh clone, where nothing is installed
  before step 2. The root has only `devDependencies` (vitest, typescript, eslint, …), so steps 1–2 use
  Node built-ins only (`node:fs`, `node:child_process`, `node:path`, `node:url`). Step 3 onward may
  load installed packages.
- **Env resolution reuses `@next/env`.** After install, the env loader does a dynamic
  `import nextEnv from "@next/env"`; the default import is the ESM form, per lesson
  `2026-11-24-next-env-cjs-esm-interop`. It then calls `nextEnv.loadEnvConfig(repoRoot)`, the exact call
  the MikroORM CLI makes in `packages/db/mikro-orm.config.ts`. Setup therefore resolves `DATABASE_URL`
  with the same file precedence as `db:migrate`; `process.env` is never overwritten. The result
  reports which source won: "environment" when `process.env.DATABASE_URL` was set before the call,
  otherwise the file name, from the loader's returned `loadedEnvFiles`. `loadEnvConfig` caches its
  first result (verified: a second call does not re-read files), so after step 3 creates `.env.local`,
  step 4 reloads with `forceReload = true`. The values the loader adds to `process.env` are inherited
  by the spawned `db:migrate`, which resolves them the same way. `@next/env` is hoisted to the root
  `node_modules` (a devDependency of `@devmentor/db`).
- **Dependency check (`lockInSync`).** Everything is read as JSON and nothing is spawned. Dependencies
  count as up to date only when all of these hold:
  1. `node_modules/.package-lock.json` (npm's hidden lockfile) exists.
  2. Every entry in it equals the same key in `package-lock.json`.
  3. Every `package-lock.json` entry missing from it has `optional: true`. Platform binaries are skipped
     by npm; on this repo that is 124 entries, all optional.
  4. For the root and every workspace, the `dependencies` / `devDependencies` / `optionalDependencies` /
     `peerDependencies` maps in `package.json` equal the corresponding `package-lock.json` entry (`""`
     and `packages/<name>`).
  Any parse error or missing file → not in sync → install. When unsure, the check installs: false
  negatives cost one `npm install`, while a false positive leaves a broken tree.
- **Running npm.** The runner spawns `process.execPath` with `process.env.npm_execpath`, which is set
  when invoked through `npm run`. That is the same npm binary that started setup, and it works on
  Windows without a shell. Without `npm_execpath` it falls back to `npm` (`npm.cmd` on win32) with
  `shell: true`. Output is inherited so the user sees npm and MikroORM progress.
- **Testability.** `runSetup(deps)` receives `{ root, fs, run, loadEnv, log, nodeVersion }`, so unit tests
  touch no real npm, database or network. Unit tests on a temporary directory cover the adapters. The
  entry file is covered by a test that mocks `./lib/setup.mjs` and imports it.
- **Tooling changes** (root config only):
  - `package.json`: `"setup": "node scripts/setup.mjs"`.
  - `tsconfig.json`: add `"allowJs": true, "checkJs": true` and `"scripts"` to `include`. This
    affects the root project only; `tsconfig.base.json` stays `allowJs: false`.
  - `vitest.config.ts`: the `unit` project also includes `scripts/**/*.test.ts`, and
    `coverage.include` adds `scripts/**/*.mjs`. This widens the gate; nothing is narrowed.
  - ESLint already lints `.mjs` at the root, so no rule change is needed.

## 📝 API Contracts

New CLI surface: `npm run setup`, with no flags and no prompts. Exit code `0` = ready, `1` = a step
failed (message printed). Messages are for humans, not parsed. It is a new root script under
`BACKWARD_COMPATIBILITY.md` §5, which is additive; the implementation adds `setup` to that list.

## 📝 Edge Cases & Failure Scenarios

| Situation | Behavior |
|---|---|
| Node too old (even very old, e.g. 18) | `scripts/setup.mjs` uses only syntax Node 18 runs, so the version message prints instead of a syntax error |
| `engines.node` in an unsupported form (not `>=X[.Y[.Z]]`) | Fail with "unsupported engines.node range: …", which is a repo bug and surfaces in tests |
| `npm install` fails (network, registry) | Exit 1; npm's own output is above; hint to re-run `npm run setup` |
| `.env.example` missing | Exit 1, naming the file |
| `.env.local` appears between check and copy (parallel run) | Exclusive copy (`COPYFILE_EXCL`) fails with `EEXIST`; treated as skipped, never overwritten |
| `DATABASE_URL` contains credentials | Always printed redacted; `URL` parsing replaces the password with `***` |
| Database server reachable, database missing | `db:migrate` fails; setup exits 1 with the redacted URL and "create the database, then re-run" (Q2) |
| No migrations exist (today `packages/db/src/migrations/` holds only `.gitkeep`) | `db:migrate` succeeds and creates `mikro_orm_migrations`; reported as done |
| `NODE_ENV=development` exported (this sandbox) | Unaffected: `loadEnvConfig(dir)` reads `.env.local` and the production-mode file names, exactly like the CLI |
| `NODE_ENV=test` exported | `@next/env` skips `.env.local` in test mode (verified), so a `DATABASE_URL` there is invisible. Setup fails with "DATABASE_URL not set (NODE_ENV=test ignores .env.local)" instead of copying `.env.example` again; `db:migrate` would ignore the file the same way |

## 📝 Risks & Impact Review

- **Additive only.** A new root script, files under `scripts/`, and docs. No change to `packages/*`,
  the schema, env variables, routes or exports. Rollback is deleting the script entry and `scripts/`.
- **Undoing what a run did.** Every action has an existing reverse:
  - `npm install`: restore the lockfile from git and re-install.
  - The created `.env.local`: delete it. Setup never edits a file it did not create.
  - Applied migrations: `npm run db:migrate:down`.
  Setup adds no state of its own; there is no marker file.
- **Coverage gate scope grows.** `scripts/**` becomes part of the 100 % gate, so future changes there
  must keep full coverage. This is intended.
- **Hidden-lockfile format is npm-internal.** It has been stable since npm 7 (`lockfileVersion` 3 here).
  If npm changes it, the check falls back to "not in sync" and setup runs `npm install` every time. That
  is slower but still correct.
- **No product decisions are touched** (no `product-brief.md` exists).

## 📋 Phasing

Phase 1 delivers the whole capability. It is small enough for one PR. No later phases are planned; Q2
(create the database) and Q4 (e2e) are possible follow-ups.

## 📋 Implementation Plan

### Phase 1: `npm run setup`

1. **Tooling for root scripts.** Add `"scripts"` plus `allowJs`/`checkJs` to the root `tsconfig.json`;
   widen `vitest.config.ts` (unit include + `coverage.include` for `scripts/**`). Verify `npm run
   typecheck` and `npm run test:coverage` still pass.
2. **Pure helpers.** In `scripts/lib/setup.mjs`, add `satisfiesEngine(range, version)`,
   `redactUrl(url)` and `lockInSync(root, fs)`, with `scripts/lib/setup.test.ts` covering:
   - each comparison branch, including unsupported ranges;
   - URLs with and without credentials, and invalid URLs;
   - in-sync, a changed entry, a missing non-optional package, a missing optional package, a manifest
     drift, a missing hidden lockfile and malformed JSON.
3. **Steps and orchestrator.** Add `runSetup(deps)` and the five steps, then test them against fake deps.
   - Assert the five Delta scenarios: fresh, re-run, lockfile change, edited `.env.local`,
     `DATABASE_URL` from shell.
   - Assert every failure path: Node, install failure, `.env.example` missing, `EEXIST` race, invalid
     URL, migrate failure.
   - Assert that no output contains a password.
4. **Adapters and entry.** Add `scripts/lib/adapters.mjs`, with tests on a temporary directory and a
   `process.execPath -e` child for the runner, including the `npm_execpath`-missing fallback. Add
   `scripts/setup.mjs` with an entry test that mocks the lib. Add `"setup"` to the root `package.json`.
5. **Docs.**
   - README: Getting started leads with `npm run setup`, keeps the four commands under "Manual setup",
     and gets a command-table row.
   - `AGENTS.md`: add a command-table row.
   - `BACKWARD_COMPATIBILITY.md`: add `setup` to the §5 root script list.
   - Add the run journal entry.
6. **Manual verification.**
   - Create a throwaway database on the sandbox server (`devmentor_setup_<random>`).
   - Run `DATABASE_URL=<it> npm run setup` twice: the first run applies, the second skips.
   - Run once with an unreachable URL: exit 1 with the password redacted.
   - Drop the database and record the outputs in the journal.
7. **Archive the Delta** into `.ai/specs/capabilities/developer-setup.md` (capability file shape), on the
   implementation PR. This is the first capability file, so the same step also documents
   `capabilities/` (living capability specs, one per area) in `.ai/specs/README.md` and in the `.ai/`
   tree in `AGENTS.md`.
