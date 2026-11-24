# Testing frameworks + GitHub CI

Goals:
- GitHub Actions CI on every pull request: lint, typecheck, build, unit tests, integration tests
- Unit test framework for TypeScript (Vitest) with a 100 % coverage gate
- Integration framework: ephemeral PostgreSQL (testcontainers) + `next start` + agent-browser
- AGENTS.md: every new feature must be 100 % covered by unit tests
- Unit tests covering 100 % of the existing code

Spec: [2026-11-24-testing-and-ci](../specs/2026-11-24-testing-and-ci.md)
Status: in-progress

---

## 2026-11-24 (CI + test frameworks)
- Covers: `.github/workflows/ci.yml` (lint, typecheck, build, unit, integration; shared `.github/actions/setup`, Node from `.nvmrc`); root `vitest.config.ts` (projects `unit`/`unit-dom`, v8 coverage at 100 % thresholds, `server-only` stub) + root `tsconfig.json`; new `packages/e2e` (testcontainers or `E2E_DATABASE_URL` throwaway DB, `db:migrate`, `next start`, `Browser` wrapper over agent-browser, health/frontend/backend suites); e2e black-box lint rule; AGENTS.md "Testing (MANDATORY)" + README.
- Bug found by the first e2e run: `/backend` was titled `Dashboard · DevMentor` (a layout's `title.template` skips its own segment) → page uses `title.absolute`; lesson added.
- Decisions/pitfalls: no Docker in the sandbox, so the testcontainers path is exercised only in CI; agent-browser rejects Playwright `>>` selectors (use `find role|nth`); `npm audit` reports 7 moderate dev-only advisories via testcontainers → archiver → glob (only "fix" is a 2-major downgrade; left as is).
- Verified: lint, typecheck, build (also without `DATABASE_URL`), integration 9/9 via `E2E_DATABASE_URL` (throwaway DB dropped, no stray server/sessions); coverage gate exits 1 on an uncovered probe file. `test:coverage` intentionally fails at this commit (no unit tests yet).
- Remaining: unit tests for the existing code (next commit); first CI run on GitHub.
