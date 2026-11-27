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

## 2026-11-27 — D30 decision record after PR #31 merged
- Covers: rebased onto `main` with PR #31 (discovery) merged; added `.ai/specs/research/decisions/D30-login-password-mentees-only.md` (status proposed) in the N01/N02 record format, a D30 `proposal` row in the brief's Decisions table, and "partially superseded by D30 (pending founder A)" on the R06 and D07 rows; spec header and Follow-ups now point at the record.
- Decisions/pitfalls: D30 quotes R06/D07 verbatim because `decisions/D07-login.md` is still absent after #31; only the password-fallback part is superseded, GitHub for every role stays. The rebase rewrites the PR #30 commits, so the push is a force-push.
- Remaining: founder A sets D30 `active` (gates Phase 2); tracker drafts (#20 AC, #14 note, GDPR issue, D07-login.md request) await approval; PR #30 merge closes this journal.

## 2026-11-27 — D30 wording fixed before founder A's signature
- Covers: fourth pre-implement audit (`bb357c9`) kept no-go only because D30 is `proposed` (Phase 1 go). Fixed its two D30 findings in the record and the brief's D30 row: "Q4a" now names the spec's design answer (the brief's own ids are Q01–Q21, Q04 unused), and a review trigger reopens D30 if 1.0 gains an email channel such as the brief's in-scope notifications.
- Decisions/pitfalls: spec-local question ids must not be cited bare in brief/decision records, which have their own Q-numbering.
- Remaining: founder A sets D30 `active`, then rerun the audit; tracker drafts (#20 AC, #14 note, GDPR issue, D07-login.md request issue) await approval.

## 2026-11-27 — correction: the product owner approves D30; Phase 2 unblocked
- Covers: correction by the user, who is the product owner. Oliwia only provided input materials and does not decide, so earlier entries' "pending founder A" / "Oliwia's signature" no longer apply (kept as written, per the never-edit rule). D30 set `active` (approved by the product owner, 2026-11-27); brief R06/D07 change path is now "a superseding record approved by the product owner"; D30 row active; spec header, Decisions in play, Phasing, Phase 2 dependency and Follow-ups no longer wait on a signature.
- Decisions/pitfalls: brief owner columns record source authors, not approvers; lesson added. Other brief rows still name founder A as owner and are unchanged here.
- Remaining: rerun the pre-implement audit; tracker drafts (#20 AC, #14 note, GDPR issue, D07-login.md request issue) await approval.

## 2026-11-27 — pre-implement audit: go
- Covers: fifth `om-pre-implement-spec` run on `af7486f` returned **go** (no Critical or Important finding); committed the report `.ai/analysis/pre-implement-2026-11-27-accounts-and-access.md`, which replaces the earlier uncommitted drafts.
- Decisions/pitfalls: two nice-to-haves remain: dynamic import of `auth-config` in `instrumentation.ts` (Phase 2 step 5) and aligning the brief's founder-A owner columns if the product owner wants them to name approvers.
- Remaining: merge PR #30 (closes this journal); tracker drafts (#20 AC, #14 note, GDPR issue, `D07-login.md` request issue) await approval; implementation not started.

## 2026-11-27 — follow-up issues linked
- Covers: posted #32 (account deletion / GDPR erasure, launch-blocking) and #33 (missing `decisions/D07-login.md` and other D03–D29 records); the spec's Follow-ups and Risks now link them instead of calling them drafts.
- Decisions/pitfalls: the #20 AC was already posted earlier, so it was skipped; the #14 closing note waits until implementation lands; the brief's owner columns stay unchanged (product owner's call).
- Remaining: merge PR #30 (closes this journal); post the #14 closing note after implementation.
