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
