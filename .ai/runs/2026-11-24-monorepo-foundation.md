# DevMentor monorepo foundation

Goals:
- Convert the starter into the DevMentor npm-workspaces monorepo: `packages/{app,core,db,ui}`
- Stack: latest Next.js 16 + React 19 + TS, PostgreSQL + MikroORM 7 (migrations, pooling), Awilix DI, Tailwind 4 (frontend), shadcn-ui (backend)
- Document all assumptions in AGENTS.md and the architecture in README.md

Spec: [2026-11-24-monorepo-foundation](../specs/implemented/2026-11-24-monorepo-foundation.md)
Status: done

---

## 2026-11-24
- Covers: monorepo layout + shared tsconfig/ESLint (with architecture-boundary rules); `core` (DI helpers, `globalSingleton`, errors), `db` (config factory, `getOrm`, entity registry, migrations CLI via tsx), `ui` (shadcn monorepo setup, theme, button/card/badge/separator), `app` (frontend/backend route groups, DI container + request scope, `HealthService`, `/api/health`); AGENTS.md + README.md rewritten; Next 16.3.4 → 16.4.6 and React 19.3.1 (critical advisories in 16.3.4).
- Decisions/pitfalls: entities stay in `db` (`defineEntity`, no decorators); Migrator only in CLI config; root `.env*` loaded by `@next/env` in both app and CLI. Pitfalls are recorded as lessons: NODE_ENV=development breaks `next build`, `@next/env` CJS/ESM interop, MikroORM snapshot name, and shadcn's `cn` package.
- Verified: `npm run lint`, `npm run typecheck`, `npm run build` pass; prod + dev servers serve `/`, `/backend` and `/api/health` (`{"status":"ok","database":"up"}`), screenshots checked; migration create/up/check/down tested with a throwaway entity (removed, DB cleaned up).
- Remaining: domain model (first entities + initial migration) in a follow-up spec.

## 2026-11-24 (phase 1 re-verification)
- Covers: added a phased plan with completion criteria to the spec; re-verified phase 1 from a clean `npm ci`. No code changes were needed.
- Verified: `lint`, `typecheck`, `build` and `npm audit` (0) pass. ESLint boundary rules reject react→core, db→ui and ui-components→frontend in negative tests. No relative cross-package imports; every import is declared. Dev server: `/`, `/backend`, `/api/health`, `/favicon.ico` → 200, unknown route → 404, health `{"status":"ok","database":"up"}`. MikroORM `migration:list` and `migration:check` work.
- Remaining: phase 2 (commit; branch choice is the user's), then the phase 3 follow-up specs.

## 2026-11-24 (phase 2: commit)
- Covers: commits the whole phase-1 migration on the new branch `feat/monorepo-foundation`. The user didn't choose a branch, so `main` stays untouched. The plan's phase 2 is marked done.
- Verified right before committing: `lint`, `typecheck` (0 errors) and `build` pass; `/api/health` → `{"status":"ok","database":"up"}`; no unstaged changes appear while `next dev` runs.
- Remaining: merging into `main` (user's decision); phase 3 follow-up specs (domain model, `/backend` auth, tests + CI).
