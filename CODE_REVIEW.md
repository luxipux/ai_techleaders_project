# Code review rules

Repo-specific review rules for DevMentor, a Next.js 16 / React 19 / TypeScript monorepo
(npm workspaces: `packages/{app,core,db,ui,e2e}`) on PostgreSQL via MikroORM, DI via Awilix.
The architecture and stack are binding: a change that introduces another ORM, DI library,
CSS framework, component kit or package manager is a blocker unless an approved spec exists.
Read `AGENTS.md`/`CLAUDE.md` for the full conventions; this file lists what reviewers check.

## Review priorities

1. **Correctness** — the change does what its ticket or spec says; edge and failure paths are handled.
2. **Security** — no secrets in code or config, server-only code kept off the client, input validated at trust boundaries.
3. **Contracts** — protected surfaces in `BACKWARD_COMPATIBILITY.md` are not broken without the required path.
4. **Architecture boundaries** — dependency direction and DI rules below hold.
5. **Tests** — behaviour is covered, not only lines (see Testing).

## Architecture boundaries (ESLint-enforced)

- `packages/core` imports no other workspace package and no React, Next.js or MikroORM. Blocker if violated.
- `packages/db` imports only `@devmentor/core` (plus MikroORM). No React, no `next/*`, no UI. Blocker if violated.
- `packages/ui` never imports `@devmentor/app` or `@devmentor/db`, and never touches the database.
- `packages/app` composes everything. Client Components never import from `src/server/` or `@devmentor/db`.
- `packages/e2e` is black-box: no `@devmentor/*` imports; it talks to the app over HTTP and agent-browser.
- Across packages use `@devmentor/*` entry points listed in `package.json#exports`. Never a relative
  path into another package (`../../db/src/...`). Blocker.
- Within a package use relative imports (app: `@/…` → `src/…`).
- No circular dependencies between packages.

## Dependency injection and server code

- Containers are created only via `createDiContainer()` from `@devmentor/core/di`. Awilix helpers are
  imported from `@devmentor/core/di`, not from `awilix`.
- Services are classes whose constructor takes one destructured cradle object typed with
  `Pick<Cradle, ...>`. New services are added to `Cradle` and registered in `buildContainer()`.
- Lifetimes: process-wide resources use `asValue`/`.singleton()`; anything that uses `em` is `.scoped()`.
  A singleton that depends on a scoped value is a blocker.
- Requests resolve work through `await getRequestContainer()`, never from the root container.
- Process-wide singletons use `globalSingleton()` from `@devmentor/core/singleton`, so `next dev`
  HMR does not leak connection pools.
- Every module under `packages/app/src/server/` starts with `import "server-only"`.
- Pages that read the database call `await connection()` (from `next/server`) first, or use a request-time API.

## Database

- Always use a forked EntityManager (request-scoped `em` from DI, or `orm.em.fork()` in scripts).
  `allowGlobalContext` is off; reusing a global `em` is a blocker.
- Entities live in `packages/db/src/entities/<name>.ts` via `defineEntity` + `p` (no decorators),
  spread `baseProperties` unless there is a stated reason not to, and are registered in
  `packages/db/src/entities/index.ts`. Folder scanning is not allowed.
- Schema changes come only through migrations (`npm run db:migration:create -- --name <slug>`).
  Flag a change to an entity with no matching migration, or a migration edited after it was shared.
  Never `schema:update` against a shared database.
- Only `packages/db/mikro-orm.config.ts` loads the `Migrator`. Runtime code must not import
  `@mikro-orm/migrations` or `@mikro-orm/cli`.
- Business rules belong in app services, not in `@devmentor/db` helpers.

## Configuration and secrets

- Env files live at the repo root (`.env.local`). Only `.env.example` is tracked. Any committed secret is a blocker.
- Env vars are read only in server code. Browser-exposed values need the `NEXT_PUBLIC_` prefix.
- Known variables: `DATABASE_URL` (required), `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_DEBUG`. New variables must be
  documented in `.env.example`.

## UI

- Public pages (`src/app/(frontend)/…`) use plain Tailwind utilities only. Importing
  `@devmentor/ui/components/*` there is a lint error.
- Backend pages (`src/app/(backend)/backend/…`) compose shadcn-ui components from `@devmentor/ui`
  and use theme tokens (`bg-background`, `text-muted-foreground`), not raw colours.
- Merge classes with `cn` from `@devmentor/ui/lib/utils`.
- Add `"use client"` only where state, effects or browser APIs are needed, as low in the tree as possible.
- No `tailwind.config.*` (Tailwind 4 is CSS-first; theme lives in `packages/ui/src/styles/globals.css`).

## TypeScript conventions

- `strict` and `noUncheckedIndexedAccess` are on. An `any` without a justifying comment is a finding.
- Use `import type` / `type` modifiers for type-only imports (`verbatimModuleSyntax`).
- Expected/domain errors extend `AppError` from `@devmentor/core/errors`.

## Testing

- Every change ships unit tests in the same change. `npm run test:coverage` must stay at 100 %
  (statements, branches, functions, lines). Blocker if coverage drops.
- Do not narrow `coverage.include`, lower `thresholds`, or add `/* v8 ignore */`. Blocker.
- Tests are colocated (`foo.ts` → `foo.test.ts`); `.test.tsx` runs in jsdom. Import `describe`/`it`/`expect`/`vi`
  from `vitest`; globals are not used.
- Unit tests never touch a real database, network or browser; mock at the boundary.
- Bug fixes start with a test that reproduces the bug.
- User-visible flows (pages, navigation, Route Handlers, DB-dependent behaviour) add or extend an
  integration test in `packages/e2e/tests/<area>.e2e.ts`. Each opened page asserts `pageErrors()` is empty.

## Validation gate

Every PR must pass, in order:

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run build`

Any failure blocks the PR.

## Severity guidance

- **Blocker** — breaks correctness or security, violates a dependency-direction or DI rule above, leaks a
  secret, breaks a protected contract without the required path, drops coverage below 100 %, or fails the gate.
- **Major** — missing tests for a new branch, wrong lifetime for a service, a missing `connection()` call on a
  DB-reading page, an unregistered entity, a raw colour in backend UI.
- **Minor** — naming, comments, small duplication, style that the linter does not catch.
