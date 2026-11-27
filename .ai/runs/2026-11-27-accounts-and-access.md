# Accounts and access spec (E01: #8, #13, #14)

Goals:
- Spec for E01: GitHub and email/password sign-in, sign-out, role-scoped access (#13, #14)
- Design the access and entry-point primitives (actor, permissions, policies, guarded
  action/route/page, audit log, clock, form contract) for consumers named in backlog E02–E05 only
- Respect N01 (no video), N02 (no ratings), D07 (GitHub + email/password)

Spec: [2026-11-27-accounts-and-access](../specs/2026-11-27-accounts-and-access.md)
Status: in-progress

---

## 2026-11-27
- Covers: the spec, design-only (no code). Gate answers: Q1a own auth (Arctic, argon2id, database sessions), Q2a role set, Q3a CLI operator grant, Q4a no email, Q5b `/backend` operator-only, Q6a domain primitives in a separate `domain-foundation` spec, Q7a zod.
- Decisions/pitfalls: an independent review found two critical defects, both fixed. (1) A redirect thrown before the flush lost the writes, so the guard now flushes and then redirects. (2) Setting cookies during Server Component render is forbidden in Next 16, so `CurrentActor` is read-only and sessions no longer slide. Owner decisions: #14 AC2 moves to #20; mentor/operator roles require GitHub, so the password fallback is for mentees only (a partial D07 deviation that founder A must confirm). Next fills `x-forwarded-for` from the socket only when the header is absent, so e2e uses a forwarding proxy with `TRUSTED_PROXY_HOPS=1`.
- Remaining: post the drafted #20 AC and the #14 closing note after approval; the `domain-foundation` spec before E02-S03; implementation per the plan. The brief and backlog this spec cites are still uncommitted on `chore/discovery-pipeline`.

## 2026-11-27 — second architectural review revisions (PR #30)
- Covers: spec-only corrections on `spec/accounts-and-access`: explicit service transactions and post-commit cookies, serialized password/claim session issuance, lightweight public guards preserving health, attempt budgets/trusted IP, retention/CLI lifecycle, OAuth error/return contracts and deliverable phases.
- Decisions/pitfalls: user accepted the review recommendations; record partial D07 supersession with advance conversion warnings for every role, defer unused list-scope/Origin code to first consumers, and distinguish HTTP 403 before streaming from nested denial UI. Lesson: neither missing final flush nor a recording EM proves rollback of executed SQL; coordinate real PostgreSQL concurrency/rollback tests.
- Verification: lint, typecheck, build and test:coverage passed (154 tests; 100% statements/branches/functions/lines), as did diff whitespace checks. Independent scope-cohesion review found no major auth-lifecycle contradiction; kept the existing E01/PR scope with independently gated phases and deferred unused scope/Origin code. No app code changed; integration was not run for this document-only revision, and new auth behavior remains unimplemented.
- Remaining: show the two-file diff and await explicit OK before commit/push to this same branch/PR; synchronize source D07 wording on discovery, post the already-owed tracker notes separately when authorized, then implement and verify the spec. Journal remains in-progress until the spec task is finalized.

## 2026-11-27 — third revision: design-review (grilling) decisions
- Covers: spec-only revision applying 18 reviewer decisions: D30 as a proposed superseding record for founder A (Phase 2 waits for it), explicit long-running-host deployment assumption re-checked at Phase 4, personal GitHub OAuth app for local `/backend`, typed `AUDIT_RETENTION` map (`role.*` forever), GitHub profile sync rules, `github_email_mismatch`, fixed 30-day sessions, per-phase implementation PRs, launch-blocking follow-ups (GDPR deletion).
- Decisions/pitfalls: `decisions/D07-login.md` is cited by the brief but absent from PR #31's branch, so D30 quotes R06/D07 verbatim and PR #31 is asked for the original. The stale untracked Polish pre-implement report is not committed; `om-pre-implement-spec` is rerun on this revision.
- Remaining: rerun pre-implement audit; after #31 merges, rebase and add D30 + brief R06/D07 marks; tracker drafts (#20 AC, #14 note, GDPR issue, PR #31 comment) await approval. Docs-only; no implementation gates claimed.

## 2026-11-27 — pre-implement audit gaps folded in
- Covers: rerun pre-implement audit on `7a1ab68` returned no-go only for status and the unsigned D30 (no design Critical). Folded its gaps into the spec: phase-scoped readiness (Phase 1 after approval, Phases 2–5 after D30), fail-open `CurrentActor.getForDisplay()` for the header so public pages survive DB outage, startup config validation in `instrumentation.ts` `register()`, BC-doc updates per phase PR, root `user:role`/`auth:cleanup` scripts, sandbox `APP_URL` docs, PR-body notes for Cradle/entity changes.
- Decisions/pitfalls: Next 16.4.6 calls `register()` once per server start and awaits it before serving; `next build` does not, so builds stay secret-free. The audit report stays uncommitted until a go/conditional verdict.
- Remaining: reviewer approved the design (status → approved in this commit); rerun the audit, D30 after #31 merges, tracker drafts await approval.
