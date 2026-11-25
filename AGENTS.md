<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DevMentor — Project Guide

**DevMentor** is a Next.js 16 / React 19 / TypeScript application in an npm-workspaces monorepo,
backed by PostgreSQL via MikroORM, wired with Awilix DI, styled with Tailwind CSS (frontend) and
shadcn-ui (backend). The stack and architecture below are **binding assumptions**: follow them, and
do not introduce alternatives (another ORM, DI library, CSS framework, component kit, or package
manager) without an approved spec.

Commands (run from the repo root):

| Command | What it does |
| --- | --- |
| `npm run setup` | One-command, idempotent setup (`scripts/setup.mjs`): install, `.env.local`, migrations |
| `npm install` | Install all workspaces (npm only — no pnpm/yarn/bun lockfiles) |
| `npm run dev` | Next.js dev server (`@devmentor/app`) |
| `npm run build` / `npm start` | Production build / server (forces `NODE_ENV=production`) |
| `npm run lint` | ESLint for the whole monorepo, incl. architecture boundary rules |
| `npm run typecheck` | `tsc --noEmit` for the root configs and every workspace (app runs `next typegen` first) |
| `npm test` / `npm run test:watch` | Unit tests (Vitest), once / in watch mode |
| `npm run test:coverage` | Unit tests with the **100 % coverage gate** (fails below 100 %) |
| `npm run test:integration` | Production build + integration tests (ephemeral PostgreSQL, `next start`, agent-browser) |
| `npm run db:migration:create -- --name <slug>` | Generate a migration from entity changes |
| `npm run db:migrate` / `db:migrate:down` | Apply / revert migrations |
| `npm run db:migration:list` / `db:schema:check` | List applied migrations / check for pending schema changes |

Definition of done for every change: `npm run lint`, `npm run typecheck`, `npm run build` and
`npm run test:coverage` (100 %) pass; `npm run test:integration` passes for UI, route, API or
database changes. CI (`.github/workflows/ci.yml`) enforces all of them on every pull request.

## Tech stack (fixed)

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 | Read `node_modules/next/dist/docs/` before using Next APIs |
| Language | TypeScript 5, `strict`, ESM everywhere | Shared options in `tsconfig.base.json` |
| Monorepo | npm workspaces, `packages/*` | Internal deps: `"@devmentor/<pkg>": "*"` |
| Database | PostgreSQL | Connection via `DATABASE_URL` |
| ORM | MikroORM 7 (`@mikro-orm/postgresql`) | `defineEntity` + `p`, migrations, pooled connections |
| DI | Awilix 14 | `PROXY` injection mode, `strict` container |
| Frontend styling | Tailwind CSS 4 | Public pages: Tailwind utilities only |
| Backend UI | shadcn-ui (Radix, `cn`, `lucide-react`) | Admin pages under `/backend` |
| Unit tests | Vitest 5 (+ `@vitest/coverage-v8`, Testing Library, jsdom) | Root `vitest.config.ts`, 100 % coverage gate |
| Integration tests | testcontainers (PostgreSQL) + agent-browser | `packages/e2e`, black-box against `next start` |
| CI | GitHub Actions | `.github/workflows/ci.yml`: lint, typecheck, build, unit, integration |

## Monorepo layout

```
packages/
  app/   @devmentor/app   Next.js application: routes, server composition (DI), app services
  core/  @devmentor/core  Framework-agnostic reusable code: DI helpers, errors, singletons, utils
  db/    @devmentor/db    Data layer: MikroORM config & lifecycle, entities, migrations, db helpers
  ui/    @devmentor/ui    Reusable UI: shadcn-ui primitives, shared components, theme CSS, `cn`
  e2e/   @devmentor/e2e   Integration tests: ephemeral PostgreSQL + `next start` + agent-browser
scripts/                  Repo scripts that must run before `npm install` (`npm run setup`)
```

`scripts/` holds plain ESM JavaScript (`.mjs`). It uses only Node.js built-ins until dependencies
are installed. It is type-checked through JSDoc by the root `tsconfig.json` and covered by the unit
gate.

Packages ship TypeScript **source** (no build step) through `package.json#exports`; Next/Turbopack
transpiles them. To use a package, add it to the consumer's `dependencies` and import a public
entry point (`@devmentor/db`, `@devmentor/core/di`, `@devmentor/ui/components/button`) — never a
relative path into another package (`../../db/src/...`). When adding a new entry point, add it to
`exports`. New packages go in `packages/<name>` as `@devmentor/<name>` with a `tsconfig.json`
extending `../../tsconfig.base.json` and a `typecheck` script.

## Architecture rules

Dependency direction (enforced by `no-restricted-imports` in `eslint.config.mjs`):

```
app ──▶ ui
 │ └──▶ db ──▶ core
 └────────────▶ core
```

- **core** depends on no workspace package and no React / Next.js / MikroORM. Put code here only if
  it is reusable regardless of framework.
- **db** depends only on `core` (+ MikroORM). No React, no Next.js APIs (`next/*`), no UI.
- **ui** never imports `app` or `db`, and never touches the database. Presentational code only.
- **app** composes everything: routes, DI container, application services, server actions.
- **e2e** is black-box: it imports no `@devmentor/*` package and talks to the app only over HTTP
  and agent-browser (it may query its own ephemeral database with `pg`).
- No circular dependencies between packages.

### App (`packages/app`)

- `src/app/(frontend)/…` — public pages. **Plain Tailwind utilities only**; importing
  `@devmentor/ui/components/*` there is a lint error. Small page-specific components may live next
  to the route (`_components/`).
- `src/app/(backend)/backend/…` — admin pages at `/backend/*`, **composed from shadcn-ui components**
  from `@devmentor/ui`. Use the theme tokens (`bg-background`, `text-muted-foreground`, …) rather
  than raw colors.
- `src/app/api/…/route.ts` — Route Handlers (Node.js runtime).
- `src/server/` — server-only code (`import "server-only"` at the top of each module):
  `container.ts` (DI composition), `services/` (application services), feature helpers.
- Server Components fetch data through services resolved from the request container; Client
  Components never import from `src/server/` or `@devmentor/db`.
- Pages that read the database must be dynamic: call `await connection()` (from `next/server`)
  before data access, or use a request-time API.

### Dependency injection (Awilix)

- Create containers only via `createDiContainer()` from `@devmentor/core/di` (PROXY mode, strict);
  import Awilix helpers (`asClass`, `asValue`, …) from `@devmentor/core/di`, not from `awilix`.
- The app's `Cradle` interface in `packages/app/src/server/container.ts` lists every registration.
  To add a service: write the class, add it to `Cradle`, register it in `buildContainer()`.
- Services are classes whose constructor takes **one destructured cradle object**, typed with
  `Pick<Cradle, ...>`: `constructor({ em, mailer }: Pick<Cradle, "em" | "mailer">)`.
- Lifetimes: process-wide resources (`orm`, clients, config) → `asValue`/`.singleton()`; anything
  that uses `em` → `.scoped()`. Strict mode rejects singletons that depend on scoped values.
- Resolve per request with `await getRequestContainer()` (memoized per request with React `cache`),
  then `container.cradle.<service>`. Never resolve request work from the root container.
- Process-wide singletons must use `globalSingleton()` from `@devmentor/core/singleton` (survives
  `next dev` HMR; avoids leaking connection pools).

### Database (MikroORM + PostgreSQL)

- One ORM / connection pool per process: `getOrm()` from `@devmentor/db`. Pool size comes from
  `DB_POOL_MIN` / `DB_POOL_MAX`; config is built only by `createOrmConfig()` in
  `packages/db/src/config.ts` (shared by runtime and CLI).
- `allowGlobalContext` is off: always use a forked EntityManager — the request-scoped `em` from DI,
  or `orm.em.fork()` in scripts.
- Entities live in `packages/db/src/entities/<name>.ts`, defined with `defineEntity` + `p` (no
  decorators), using the `defineEntity` → `class X extends XSchema.class {}` → `XSchema.setClass(X)`
  pattern. Spread `baseProperties` (uuid `id`, `createdAt`, `updatedAt`) unless there is a reason
  not to. **Register every entity** in `packages/db/src/entities/index.ts` (no folder scanning).
- Schema changes go through migrations only: change entities → `npm run db:migration:create --
  --name <slug>` → review the generated SQL → `npm run db:migrate`. Commit the migration together
  with `src/migrations/.snapshot-devmentor.json`. Never edit a migration that has been applied/shared;
  never use `schema:update` against shared databases.
- The CLI config `packages/db/mikro-orm.config.ts` is the only place that loads the `Migrator`;
  do not import `@mikro-orm/migrations` or `@mikro-orm/cli` from runtime code.
- MikroORM packages and `pg` stay in `serverExternalPackages` (`packages/app/next.config.ts`).
- Data-access helpers reusable across features go in `packages/db/src/helpers.ts` (or a sibling
  module exported from `@devmentor/db`); business rules belong in app services.

### UI (Tailwind CSS 4 + shadcn-ui)

- Theme tokens and the Tailwind entry point live in `packages/ui/src/styles/globals.css`; the app
  imports it once from `src/app/globals.css`. No `tailwind.config.*` (Tailwind 4 is CSS-first).
- Add shadcn components with the CLI **from `packages/app`**: `npx shadcn@latest add <component>`
  (monorepo mode installs into `packages/ui/src/components/`). Keep generated files close to
  upstream; build variants/compositions in separate files in `packages/ui/src/components/`.
- Import components as `@devmentor/ui/components/<name>` and merge classes with `cn` from
  `@devmentor/ui/lib/utils`.
- Components using state, effects or browser APIs need `"use client"`; keep it as low in the tree
  as possible.

### Configuration & environment

- Env files live at the **repo root** (`.env.local`, see `.env.example`). Both `next.config.ts` and
  the MikroORM CLI load them with `@next/env`. Never commit secrets; only `.env.example` is tracked.
- Read env vars only in server code; anything exposed to the browser needs the `NEXT_PUBLIC_` prefix.
- Variables: `DATABASE_URL` (required), `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_DEBUG`.

### Code conventions

- TypeScript `strict` + `noUncheckedIndexedAccess`; no `any` without a justifying comment.
- `verbatimModuleSyntax`: use `import type` / `type` modifiers for type-only imports.
- Within a package use relative imports (app: `@/…` → `src/…`); across packages use `@devmentor/*`.
- Expected/domain errors extend `AppError` from `@devmentor/core/errors`.
- Keep the sandbox manifest `om-sandbox.toml` working (`npm run dev` from the root on `0.0.0.0:3000`).

## Testing (MANDATORY)

### Unit tests: 100 % coverage, no exceptions

- **Every new feature or change ships with unit tests that keep coverage at 100 %** for
  statements, branches, functions and lines. Coverage below 100 % fails `npm run test:coverage`
  and the `unit` CI job, so the pull request cannot be merged. Write the tests in the same
  change as the code, never "later".
- The gate covers `packages/{core,db,app,ui}/src/**` and `scripts/**/*.mjs`, plus
  `packages/db/mikro-orm.config.ts` and `packages/app/next.config.ts`. Files that no test imports
  count as 0 %, so new files can't slip through. Do not narrow `coverage.include`, lower `thresholds`, or add `/* v8 ignore */`
  comments. If code truly cannot be unit-tested, raise it in the spec and get the user's
  approval first.
- Cover behaviour, not just lines: every branch (success, failure, empty and edge inputs) gets an
  assertion on its observable result. Bug fixes start with a test that reproduces the bug.
- Tests are colocated: `foo.ts` → `foo.test.ts`. `*.test.ts` runs in Node (project `unit`),
  `*.test.tsx` in jsdom with Testing Library (project `unit-dom`). Import `describe`/`it`/`expect`/`vi`
  from `vitest` (no globals).
- Unit tests never touch a real database, network or browser. Mock at the boundary: a fake `em`
  (`getConnection().execute`), `vi.spyOn(MikroORM, "init")`, `vi.mock("next/server")`, or
  `vi.mock("@/server/…")` for pages. `server-only` is aliased to a no-op stub. Clear singletons
  you create (`clearGlobalSingleton`) and use `vi.stubEnv` for env vars; restored automatically.
- Async Server Components: `render(await Page())`. `<html>` layouts: `renderToStaticMarkup`.

### Integration tests (`packages/e2e`)

- Add or extend an integration test for every user-visible flow: pages, navigation, Route
  Handlers, and anything that depends on the database schema. Name files `tests/<area>.e2e.ts`.
- `npm run test:integration` builds the app and runs the suites. Global setup starts an ephemeral
  PostgreSQL (testcontainers, `postgres:17-alpine`), runs `npm run db:migrate` against it, starts
  `next start` on a free port, and tears everything down afterwards. Tests get `inject("baseUrl")`
  and `inject("databaseUrl")`.
- Without Docker (e.g. this sandbox), set `E2E_DATABASE_URL` to a PostgreSQL server URL. Setup then
  creates and drops a throwaway `devmentor_e2e_<random>` database there instead:
  `E2E_DATABASE_URL="$DATABASE_URL" npm run test:integration`.
- Drive the browser through `Browser` (`packages/e2e/src/browser.ts`), a typed wrapper over the
  `agent-browser` CLI. Each instance has its own session, so always `close()` it in `afterAll`.
  Prefer semantic locators (`clickByRole`), stable `data-slot` hooks and `snapshot()` refs over
  layout-dependent CSS. agent-browser does not understand Playwright's `>>` selector chains.
  Assert `pageErrors()` is empty on every page you open. For commands without a helper, use
  `browser.run(...)` and see `npx agent-browser skills get core`.
- First-time local setup: `npx agent-browser install` (CI uses `--with-deps`).

### CI

`.github/workflows/ci.yml` runs on every pull request and push to `main`: `lint`, `typecheck`,
`build`, `unit` (100 % coverage, uploads the `coverage` artifact) and `integration`. All jobs must
be green before merging. Keep the shared install steps in `.github/actions/setup` and the Node
version in `.nvmrc`.

## Working agreements (MANDATORY)

This repo uses spec-driven development with AI metadata stored in `.ai/`. Follow these rules for every task.

1. **Before starting**
   - Read `.ai/lessons.md` (lessons learned) and apply what is relevant.
   - Look in `.ai/specs/` for a relevant spec; for non-trivial features, write a spec first.
   - Look in `.ai/runs/` for an existing journal for this task. If one exists, read it and continue in the same file.
2. **Spec-driven development** — specs live in `.ai/specs/YYYY-MM-DD-slug.md`. Implement against the spec. When fully implemented, move it to `.ai/specs/implemented/`; if abandoned/superseded, move it to `.ai/specs/archive/`.
3. **Run journal** — one file per task: `.ai/runs/YYYY-MM-DD-slug.md`.
   - Create it in the task's **first commit**. The date is the task start date. Never rename it or start a new file for another session.
   - Fixed header: goals, link to the spec (if any), and `Status: in-progress` or `Status: done` (set `done` only when the task is complete).
   - For **every commit**, append a 2–5-line entry at the end: date, what the commit covers, decisions/pitfalls, what remains. Never edit earlier entries. Write the entry *before* committing and include it in that same commit. Do not defer logging.
4. **Lessons**: after fixing a bug, being corrected by the user, or learning something non-obvious, add `.ai/lessons/YYYY-MM-DD-slug.md` and a one-line index entry in `.ai/lessons.md`. Write it as a rule for yourself that prevents the same mistake. If a lesson applies to every task, promote it to a rule in this file.

## Working principles

- **Plan complex work first.** For multi-step or multi-file changes, write a plan before editing (plan mode, or the spec for larger features). Aim for a plan good enough to implement in one pass. If implementation goes off track, stop and re-plan instead of pushing forward.
- **Verify every change.** Don't claim work is done until you've checked it. At minimum, run `npm run lint`, `npm run build` and `npm run test:coverage`. For UI or runtime changes, run the app and confirm the behavior (see the `workspace-agent` skill). Report failures honestly, and record what you verified in the journal entry.
- **Fix bugs autonomously.** Given a bug report, failing build, or logs, investigate the root cause and fix it without asking for step-by-step direction. Ask only when requirements are truly ambiguous.
- **Prefer the elegant solution.** If a fix feels hacky, take what you've learned, discard it, and implement the clean solution before committing.
- **Use subagents** for broad searches or independent parallel work, so the main context stays focused.
- **Turn repeated workflows into skills.** Anything done repeatedly becomes a committed skill under `.claude/skills/` (mirrored in `.agents/skills/`).
- **Parallel sessions** (e.g. separate git worktrees) each work on their own task with their own run journal.

## `.ai/` structure

```
.ai/
  specs/                     # specifications: YYYY-MM-DD-slug.md
    implemented/             # fully implemented specs
    archive/                 # abandoned / superseded specs
    capabilities/            # living capability specs (current behavior, from spec Deltas)
  runs/                      # task journals: YYYY-MM-DD-slug.md (one per task)
  lessons.md                 # index of lessons learned (read first)
  lessons/                   # detailed lessons: YYYY-MM-DD-slug.md
  cezar/                     # sandbox-managed; do not edit
```

Details and templates: `.ai/specs/README.md`, `.ai/runs/README.md`, `.ai/lessons/README.md`.
