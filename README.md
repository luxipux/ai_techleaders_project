# DevMentor

DevMentor is a web application for mentoring software developers. It is built as a TypeScript
monorepo on **Next.js 16 / React 19**, with **PostgreSQL + MikroORM** for data, **Awilix** for
dependency injection, **Tailwind CSS** for frontend pages and **shadcn-ui** for backend pages.

> Contributors and coding agents: the binding rules live in [`AGENTS.md`](AGENTS.md).

## Getting started

Requirements: Node.js ≥ 22, npm, PostgreSQL.

```bash
npm install
cp .env.example .env.local      # repo root; set DATABASE_URL
npm run db:migrate              # apply migrations
npm run dev                     # http://localhost:3000  (backend: /backend)
```

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | Lint the whole monorepo (incl. architecture boundaries) |
| `npm run typecheck` | Type-check every workspace |
| `npm test` / `npm run test:watch` | Unit tests (Vitest) |
| `npm run test:coverage` | Unit tests + coverage report; fails below 100 % |
| `npm run test:integration` | Build, then run integration tests (ephemeral PostgreSQL + agent-browser) |
| `npm run db:migration:create -- --name <slug>` | Generate a migration from entity changes |
| `npm run db:migrate` / `npm run db:migrate:down` | Apply / revert migrations |
| `npm run db:migration:list` / `npm run db:schema:check` | List executed migrations / check for pending schema changes |

`GET /api/health` returns application and database health (`200` when healthy, `503` otherwise).

## Architecture

### Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript 5 (strict, ESM) |
| Monorepo | npm workspaces (`packages/*`) |
| Database | PostgreSQL |
| ORM | MikroORM 7: `defineEntity`, migrations, connection pooling |
| Dependency injection | Awilix 14 |
| Frontend styling | Tailwind CSS 4 |
| Backend UI | shadcn-ui (Radix primitives, `lucide-react` icons) |

### Repository layout

```
.
├── packages/
│   ├── app/    @devmentor/app   Next.js application
│   ├── core/   @devmentor/core  framework-agnostic reusable code
│   ├── db/     @devmentor/db    data layer (MikroORM)
│   ├── ui/     @devmentor/ui    reusable UI components (shadcn-ui) + theme
│   └── e2e/    @devmentor/e2e   integration tests (testcontainers + agent-browser)
├── .github/                     CI workflow (lint, typecheck, build, unit, integration)
├── .ai/                         specs, run journals and lessons (AI-assisted workflow)
├── .env.example                 environment variables (copy to .env.local)
├── eslint.config.mjs            one ESLint config for all packages
├── tsconfig.base.json           shared TypeScript options
├── vitest.config.ts             unit tests + 100 % coverage gate (all packages but e2e)
└── om-sandbox.toml              sandbox service manifest
```

Workspace packages ship TypeScript source through `package.json#exports` (no build step);
Turbopack transpiles them as part of the app.

### Packages and dependency direction

```
            ┌──────────────────┐
            │  @devmentor/app  │  routes · DI composition · app services
            └──┬─────┬──────┬──┘
               │     │      │
               ▼     │      ▼
 ┌───────────────┐   │   ┌───────────────┐
 │ @devmentor/ui │   │   │ @devmentor/db │  MikroORM · entities · migrations
 └───────────────┘   │   └───────┬───────┘
                     ▼           ▼
                 ┌─────────────────┐
                 │ @devmentor/core │  DI helpers · errors · singletons
                 └─────────────────┘
```

- **`@devmentor/core`**: building blocks that don't depend on any framework. It includes the DI
  helpers (`createDiContainer`, Awilix re-exports), `globalSingleton` (HMR-safe process singletons)
  and the shared error types (`AppError`, `NotFoundError`, `ValidationError`). It has no React,
  Next.js or MikroORM dependencies.
- **`@devmentor/db`**: everything that talks to PostgreSQL.
  - `createOrmConfig()` builds the single MikroORM config, shared by the runtime and the CLI.
  - `getOrm()` / `closeOrm()` manage the one ORM instance and connection pool per process.
  - Entities live in `src/entities/` and are listed in an explicit registry.
  - Migrations live in `src/migrations/`.
  - Shared helpers include `pingDatabase` and `toPagination`.
- **`@devmentor/ui`** holds the design system: the shadcn-ui components (`src/components/`), the
  Tailwind 4 entry point with theme tokens (`src/styles/globals.css`), `cn`, and the shared PostCSS
  config.
- **`@devmentor/app`** is the Next.js app. It contains the routes, the DI container
  (`src/server/container.ts`) and the application services (`src/server/services/`).

ESLint enforces these boundaries (`no-restricted-imports`). For example, `core` can't import
React, `ui` can't import `db`, and frontend pages can't import shadcn components.

### Frontend and backend

| | Frontend | Backend |
| --- | --- | --- |
| Routes | `packages/app/src/app/(frontend)/` → `/`, … | `packages/app/src/app/(backend)/backend/` → `/backend/*` |
| Audience | Public visitors, learners | Operators and admins |
| Styling | Tailwind CSS utilities | shadcn-ui components from `@devmentor/ui` with theme tokens |

Both route groups share the root layout and stylesheet (`src/app/globals.css`, which imports
`@devmentor/ui/globals.css`). Each group has its own layout shell.

### Request flow and dependency injection

```
Request ─▶ Server Component / Route Handler
             └─ getRequestContainer()            (React cache: one scope per request)
                  ├─ em = orm.em.fork()          (request-scoped identity map / unit of work)
                  └─ cradle.healthService        (scoped service, constructed with { em })
                        └─ MikroORM ─▶ pg pool ─▶ PostgreSQL
```

- The **root container** is built once per process (`getContainer()`). It holds singletons such as
  `orm`.
- Each request gets a **scoped container**, with its own forked `EntityManager` registered as `em`.
  Services that use `em` are registered as `scoped`.
- Awilix runs in `PROXY` mode with `strict` on. Services receive their dependencies as a single
  destructured object (`constructor({ em }: Pick<Cradle, "em">)`). This style survives
  minification, and strict mode stops singletons from capturing request-scoped state.
- The ORM and container are stored on `globalThis` (`globalSingleton`). Hot reloads in `next dev`
  therefore reuse the existing connection pool instead of opening a new one.

### Data layer

- Entities are defined with MikroORM's `defineEntity` + `p` builders, with no decorators, so
  Turbopack and SWC need no special config. They spread `baseProperties` (uuid `id`, `createdAt`,
  `updatedAt`) and must be added to `packages/db/src/entities/index.ts`.
- The global `EntityManager` context is disabled (`allowGlobalContext: false`). All work goes
  through a fork.
- Connection pooling: each process has one pool, sized by `DB_POOL_MIN` / `DB_POOL_MAX`
  (default 0–10, 30 s idle timeout).
- Migrations are TypeScript files generated by the MikroORM CLI (run through `tsx`) from
  `packages/db/mikro-orm.config.ts`. That config is the only place the `Migrator` is loaded, so
  migration tooling never ends up in the app bundle. Each migration runs in a transaction. A
  schema snapshot (`.snapshot-devmentor.json`) is committed next to the migrations.
- MikroORM and `pg` are excluded from the server bundle (`serverExternalPackages`) and loaded by
  Node.js at runtime.

### Configuration

Env files live at the repo root. `next.config.ts` and the MikroORM CLI both load them with
`@next/env`, so they resolve the same values.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `DB_POOL_MIN` | no | `0` | Minimum pooled connections per process |
| `DB_POOL_MAX` | no | `10` | Maximum pooled connections per process |
| `DB_DEBUG` | no | `false` | Log SQL queries |

### Testing and CI

- **Unit tests** use Vitest. They live next to the code (`foo.ts` → `foo.test.ts`, React components
  in `*.test.tsx` under jsdom with Testing Library). Coverage must stay at **100 %**
  (statements, branches, functions, lines), and every new feature ships with its tests.
  The HTML report is written to `coverage/index.html`.
- **Integration tests** (`packages/e2e`) are black-box. Global setup starts a throwaway PostgreSQL
  with testcontainers (Docker required), migrates it with the MikroORM CLI and starts the
  production build (`next start`). The tests then drive real Chrome through
  [agent-browser](https://github.com/vercel-labs/agent-browser) and call the HTTP API.
  - One-time setup: `npx agent-browser install` (Chrome for Testing).
  - No Docker? `E2E_DATABASE_URL=postgres://user:pass@host:5432/postgres npm run test:integration`
    creates and drops a temporary database on that server instead.
- **CI** (`.github/workflows/ci.yml`) runs on every pull request and push to `main`, with five
  parallel jobs: lint, typecheck, build, unit (coverage gate, report uploaded as an artifact) and
  integration. To block merging on red checks, mark the jobs as required in the branch protection
  rules for `main`.

### Development workflow

Work is spec-driven, and the metadata for it lives in `.ai/`:
- `.ai/specs/` holds the specs; implemented ones move to `implemented/`.
- `.ai/runs/` holds one journal per task.
- `.ai/lessons.md` lists lessons learned.

See [`AGENTS.md`](AGENTS.md) for the full rules. The spec for this foundation is
[`.ai/specs/implemented/2026-11-24-monorepo-foundation.md`](.ai/specs/implemented/2026-11-24-monorepo-foundation.md).
