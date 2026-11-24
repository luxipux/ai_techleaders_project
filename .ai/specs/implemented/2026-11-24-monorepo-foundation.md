# DevMentor monorepo foundation

## Goal / problem

Turn the single-package Next.js starter into the **DevMentor** monorepo with the agreed stack, so that
feature work can start on a consistent, documented architecture:

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + MikroORM 7 (migrations, connection pooling)
- Awilix 14 dependency injection
- Tailwind CSS 4 for frontend (public) pages, shadcn-ui for backend (admin) pages
- npm workspaces monorepo under `packages/`: `app`, `core`, `db`, `ui`

## Scope & non-goals

In scope:
- Workspace layout, shared TypeScript config, root scripts, single ESLint config.
- `@devmentor/app`: the Next.js app (moved from `src/`), frontend + backend route groups, DI wiring,
  a health check (`/api/health`) that exercises DI → ORM → Postgres end-to-end.
- `@devmentor/core`: DI primitives (Awilix helpers), HMR-safe global singleton helper, shared errors.
- `@devmentor/db`: MikroORM config factory (pool, env), ORM lifecycle (`getOrm`), entity registry,
  migrations folder + CLI config, db helpers.
- `@devmentor/ui`: shadcn-ui setup (components.json, theme CSS, `cn`), initial primitives
  (button, card, badge).
- Docs: root `AGENTS.md` architecture rules, `README.md` architecture notes.

Non-goals:
- Domain entities/features of DevMentor (none are invented here; the entity registry starts empty).
- Auth, i18n, testing framework, CI, Docker.

## Design

### Workspace

```
package.json            # private root, "workspaces": ["packages/*"], proxy scripts
tsconfig.base.json      # shared strict compiler options
eslint.config.mjs       # one flat config for the whole repo (next rootDir = packages/app)
.env.example            # env vars; real .env* files live at repo root
packages/
  app/   @devmentor/app   Next.js application (routes, DI composition, app services)
  core/  @devmentor/core  framework-agnostic reusable code (DI helpers, errors, utils)
  db/    @devmentor/db    MikroORM config, ORM lifecycle, entities, migrations, db helpers
  ui/    @devmentor/ui    shadcn-ui primitives + shared React components + theme CSS
```

- All packages are ESM (`"type": "module"`), ship **TypeScript source** (no build step) via `exports`,
  and are consumed by Next (Turbopack transpiles workspace packages automatically).
- Dependency direction: `app → ui, db, core`; `db → core`; `ui` and `core` depend on no workspace
  package. No cycles; `core` stays free of React/Next/MikroORM.
- Internal deps are declared as `"@devmentor/x": "*"` in each package's `package.json`.

### Environment

- Env files live at the repo root. `next.config.ts` and the MikroORM CLI config both call
  `loadEnvConfig(repoRoot)` from `@next/env`, so app and CLI resolve the same variables.
- `DATABASE_URL` (required), `DB_POOL_MIN` / `DB_POOL_MAX` (optional), `DB_DEBUG` (optional).

### Database (`@devmentor/db`)

- `createOrmConfig(overrides?)` → `defineConfig` from `@mikro-orm/postgresql` with `clientUrl`, `pool`,
  entities from the registry (`src/entities/index.ts`), `migrations.pathTs = src/migrations`.
- `getOrm()` → lazily `MikroORM.init`, memoized on `globalThis` (survives HMR, single pool per process).
- `closeOrm()` for scripts/tests.
- Entities use `defineEntity` + `p` (no decorators). Migrations are TS, created by the CLI.
- `mikro-orm.config.ts` (CLI only) adds the `Migrator` extension, so runtime bundles never load
  `@mikro-orm/migrations`. CLI runs TS config via `tsx`.
- Next: `@mikro-orm/*` and `pg` kept external (`serverExternalPackages`).

### DI (`@devmentor/core` + app)

- `core` re-exports Awilix primitives and provides `createDiContainer<Cradle>()` (strict, PROXY mode)
  and `globalSingleton(key, factory)`.
- App: `src/server/container.ts` defines the `Cradle` type and `getContainer()` (async, memoized
  root container: `orm` as value, services as classes). `getRequestContainer()` (React `cache`)
  creates a per-request scope with `em = orm.em.fork()`.
- Services are classes with a single destructured-cradle constructor arg (PROXY mode is
  minification-safe).
- Server-only modules import `server-only`.

### UI

- `@devmentor/ui` holds the shadcn-ui setup: `components.json` (also in app, monorepo mode),
  `src/styles/globals.css` (Tailwind 4 import, `tw-animate-css`, theme tokens, `@source` for ui),
  `src/lib/utils.ts` (`cn`), `src/components/*` (shadcn primitives, added via `npx shadcn add`).
- App `src/app/globals.css` imports the ui styles; Tailwind scans app sources automatically.
- Routes:
  - `src/app/(frontend)/…` — public pages, built with plain Tailwind utilities.
  - `src/app/(backend)/backend/…` — admin pages under `/backend`, composed from shadcn components.

## Acceptance criteria

- `npm install`, `npm run lint`, `npm run typecheck`, `npm run build` succeed from the root.
- `npm run dev` (sandbox manifest unchanged) serves `/` (Tailwind frontend page) and `/backend`
  (shadcn dashboard showing DB status).
- `GET /api/health` returns `{ status: "ok", database: "up" }` against the local Postgres.
- `npm run db:migration:create` / `db:migrate` work through the MikroORM CLI.
- `AGENTS.md` documents all stack/architecture assumptions; `README.md` has architecture notes.

## Open questions

- Domain model of DevMentor (first entities) — to be specified in a follow-up spec.

## Plan

| # | Phase | Completion criteria | Status |
| --- | --- | --- | --- |
| 1 | **Workspace & package split.** Move the app to `packages/app`; split out `core`, `db` and `ui` by responsibility; set up workspaces, inter-package deps, `exports`/imports, root scripts, shared tsconfig, one ESLint config with boundary rules. | Clean `npm ci`, `lint`, `typecheck` and `build` pass. Dev server (sandbox manifest unchanged) serves `/`, `/backend`, `/api/health` and the favicon. Boundary lint rules reject forbidden imports. No relative imports across packages. Every import is declared in its package's `package.json`. MikroORM CLI runs. | ✅ done (verified 2026-11-24) |
| 2 | **Land the change.** Commit the migration with the run journal. | Committed on branch `feat/monorepo-foundation` (`main` untouched; merge is the user's call); tree clean after `next dev`. | ✅ done (2026-11-24) |
| 3 | **Follow-ups**, each in its own spec: domain model (first entities + initial migration), `/backend` authentication, test framework + CI. | A separate spec per item. | ⏭ next |

Behavior notes for phase 1:
- Kept: the root layout, favicon, App Router and the dev server command and port.
- Changed deliberately: the sandbox starter placeholder at `/` (backdrop, `page.module.css`,
  starter SVGs) became the DevMentor frontend page. `/backend` and `/api/health` are new.
  The original starter is recoverable from commit `933b5c2`.
