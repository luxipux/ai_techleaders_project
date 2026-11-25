# `npm run setup` installer (issue #4)

Goals:
- One idempotent command, `npm run setup`, that runs the README "Getting started" steps and skips the ones already done
- README documents it, keeping the manual steps as the alternative
- 100 % unit-test coverage kept; lint, typecheck and build green

Spec: [2026-11-25-npm-run-setup-installer](../specs/2026-11-25-npm-run-setup-installer.md)
Status: in-progress

---

## 2026-11-25 (spec)
- Covers: the spec, written with `om-spec-writing --autonomous` via `om-auto-fix-issue 4` → `om-auto-write-spec`, on a design-only spec PR.
- Decisions/pitfalls: Q1–Q5 resolved with reversible defaults (no dev server, no DB creation, root `scripts/` in `.mjs`, no e2e, never shadow an existing `DATABASE_URL`). Verified in the sandbox: `@next/env` `loadEnvConfig` caches (needs `forceReload` after creating `.env.local`) and ignores `.env.local` under `NODE_ENV=test`; the hidden lockfile matches `package-lock.json` except 124 optional platform packages; `db:migrate` exits 1 with clear errors for a missing or unreachable database. A fresh-context scope review found the spec cohesive; its two Low findings are applied.
- Remaining: implementation PR (`om-auto-implement-spec`), Delta archive into `.ai/specs/capabilities/developer-setup.md`.

## 2026-11-25 (review fixes)
- Covers: applied `om-code-review` findings on PR #5: Q3 now states `.mjs` in `scripts/` is a scoped exception to the TypeScript rule (pre-install bootstrap only); one line says this work introduces the Delta format and `capabilities/`; removed the Node 18 syntax claim from Edge Cases.
- Decisions/pitfalls: removed the whole Node-18 row, since step 1 of the table already covers an unsupported Node.
- Remaining: implementation PR, Delta archive.
