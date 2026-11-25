# Backward compatibility

This file lists the protected contract surfaces of DevMentor and how a change to each one must be handled.
Review skills check changes against it, and implementation skills warn when a change would break it.
A breaking change needs an explicit note in the PR body and the path below; without it, it is a blocker.

## Surfaces

### 1. Workspace package entry points (`@devmentor/*`)

Consumers import only the entry points listed in each package's `package.json#exports`.

| Package | Public entry points |
| --- | --- |
| `@devmentor/core` | `.`, `./di`, `./errors`, `./singleton` |
| `@devmentor/db` | `.`, `./entities` |
| `@devmentor/ui` | `./globals.css`, `./postcss.config`, `./components/*`, `./lib/*`, `./hooks/*` |
| `@devmentor/app` | none (application, not a library) |
| `@devmentor/e2e` | none (test package) |

**Breaking:** removing or renaming an export, changing a function signature or return type, changing the
`Cradle` shape or a service constructor contract, removing a `components/*` prop, changing `createOrmConfig` or
`getOrm` behaviour, or moving a path without an `exports` entry.
**Required path:** keep the old export as a deprecated alias for one release with a JSDoc `@deprecated` note
pointing to the replacement; list the change under "Breaking changes" in the PR body; update every consumer in
the same PR. Adding exports and optional parameters is non-breaking.

### 2. HTTP routes

| Route | Shape |
| --- | --- |
| `GET /api/health` | JSON health report from `getHealthReport()`; HTTP 200 when `status` is `"ok"`, otherwise 503; `Cache-Control: no-store` |
| `/` (frontend) | Public page, `packages/app/src/app/(frontend)/page.tsx` |
| `/backend` (admin) | Admin page, `packages/app/src/app/(backend)/backend/page.tsx` |

**Breaking:** renaming or moving a route, changing the health response fields or status codes that monitors depend
on, or removing a page that external links point to.
**Required path:** add the new route before removing the old one; keep the old route as a redirect or alias
for one release; note the change in the PR body.

### 3. Database schema and migrations

- The PostgreSQL schema is owned by MikroORM migrations under `packages/db` (`src/migrations/`; the snapshot file
  `.snapshot-devmentor.json` is committed alongside them). No migration exists yet; this surface begins with the first one.
- Every migration that has been applied to a shared database is immutable.
- Entity column identifiers and the `baseProperties` columns (`id` UUID, `createdAt`, `updatedAt`) are part of
  the contract.

**Breaking:** dropping or renaming a table or column, changing a column type or nullability without a
backfill, changing the primary key type, or editing an applied migration.
**Required path:** write a new forward migration (expand, migrate data, then contract across releases);
verify the revert with `npm run db:migrate:down` on a throwaway database; never use `schema:update` against a
shared database. Schema-changing PRs carry the `risk-high` label by default under `SDLC.md`.

### 4. Environment variables

| Variable | Required | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `DB_POOL_MIN` | no (default `0`) | Minimum pool size per process |
| `DB_POOL_MAX` | no (default `10`) | Maximum pool size per process |
| `DB_DEBUG` | no (default `false`) | `"true"` logs SQL |

**Breaking:** renaming or removing a variable, or changing its default meaning.
**Required path:** read the new name with a fallback to the old one for one release; document the change in `.env.example`
and in the PR body.

### 5. npm scripts and CLI commands

Root scripts: `setup`, `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:coverage`,
`test:integration`, `db:migration:create`, `db:migrate`, `db:migrate:down`, `db:migration:list`, `db:schema:check`.

**Breaking:** removing or renaming a script that CI (`.github/workflows/ci.yml`), the validation gate in
`.ai/agentic.config.json`, or contributors rely on, or changing the meaning of a `db:*` script's arguments.
**Required path:** update CI and `.ai/agentic.config.json` in the same PR; keep the old name as an alias for one release.

### 6. Configuration files

- `.ai/agentic.config.json` (the pipeline config read by every `om-*` skill). Its keys and value shapes are the contract.
- `om-sandbox.toml` (sandbox manifest; `npm run dev` from the root on `0.0.0.0:3000` must keep working).
- `packages/db/mikro-orm.config.ts` (CLI entry; the only place that loads the `Migrator`).
- `packages/app/next.config.ts` (`serverExternalPackages` must keep the MikroORM and `pg` packages).

**Breaking:** removing a key, changing an enum value's meaning, or moving a file the CLI or the sandbox reads.
**Required path:** accept the old form for one release and report a migration note; update `om-sandbox.toml`
and the CLI config together with any path change.

## Internal contracts (enforced by lint, not public)

These are not published to consumers, but changing them still needs a note in the PR body because
they are enforced by ESLint and review:

- Dependency direction: `app → ui`, `app → db → core`, `app → core`.
- The `Cradle` interface in `packages/app/src/server/container.ts` and the `buildContainer()` registrations.
- The `entities` registry in `packages/db/src/entities/index.ts`.
- The unit-test coverage gate (100 %) in `vitest.config.ts`. Lowering it is a breaking change to the quality contract.

## Reviewing a change against this file

1. List every changed file that falls under a surface above.
2. For each, decide whether the change is additive (non-breaking) or breaking, using the rules in its section.
3. A breaking change without its required path is a blocker. Name the surface and section in the finding.
