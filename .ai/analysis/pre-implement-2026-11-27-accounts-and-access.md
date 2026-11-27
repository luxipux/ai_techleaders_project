# 🔍 Pre-implementation analysis: Accounts and access (E01) and the access / entry-point primitives

**Readiness: go** — the spec is approved, every product rule it changes is superseded by an active
record (D30, approved by the product owner), and no Critical or Important finding remains; the
spec can be implemented phase by phase as planned.
Spec: `.ai/specs/2026-11-27-accounts-and-access.md` (commit `af7486f`) · spec PR #30 · issues #8, #13, #14 ·
audited 2026-11-27 against `BACKWARD_COMPATIBILITY.md`, template built-in (no `paths.specTemplate`,
no template file in `.ai/specs/`).

Fifth audit. Since the previous one (`bb357c9`, no-go only because D30 was `proposed`): D30's
wording was fixed (`47da542`) and D30 was set `active` by the product owner, with the brief's
R06/D07 change path updated (`af7486f`). All earlier findings are addressed.

## 📋 Readiness gate

| # | Item | Result | Evidence / fix |
|---|------|--------|----------------|
| R1 | Declared status | ✅ | `Status: approved (2026-11-27, design review of PR #30…)`. |
| R2 | No blocking open questions | ✅ | No open questions; D30 `Status: active — approved by the product owner, 2026-11-27`; no phase waits on a decision record (spec header, Decisions in play, Phasing, Follow-ups). |
| R3 | Traceability | ✅ | Delta scenarios map to phase steps and unit/e2e oracles; "Another user's resource" is unit-only by recorded decision (moved to #20, E03-S02 in the backlog). |
| R4 | Contracts defined | ✅ | Actions, routes, callback codes, CLI and root scripts, env vars and startup validation, `ActionResult`, retention map, fail-closed `get()` / fail-open `getForDisplay()`; UI states incl. DB-down. |
| R5 | Phases deliverable | ✅ | Each phase has dependencies and an exit gate; Phase 2 depends only on Phase 1; Phase 4 re-checks the deployment assumption. |
| R6 | Grounded in the codebase and sources | ✅ | Code claims as verified in the previous audits (unchanged since: the last three commits touch only `.ai/` documents). Source claims: backlog ids and consumers, R07/D08, D19/R18 and the clock-consumer rules match the brief; R06/D07 rows read "active; partially superseded by D30 (2026-11-27)" with change path "a superseding record approved by the product owner", and the D30 row is active. |

## 💥 Backward compatibility

No unaddressed change (unchanged from the previous audit): additive exports, first migration, new
optional env vars validated at start, new root scripts; `/` survives DB outage via
`getForDisplay()`; `/api/health` preserved; `/backend` access change documented; per-phase
`BACKWARD_COMPATIBILITY.md` updates and PR-body notes planned. The latest commits touch only
`.ai/` documents, which are not protected surfaces.

## 🔍 Product-brief compliance

| Entry (brief) | Finding | Severity |
|---------------|---------|----------|
| R06 / D07 | Partially superseded by D30, which is active and approved by the product owner. | — |
| D19 "an admin role with screens does not fit the first iteration" | Not a contradiction: the spec gates the existing dashboard and adds no operator screens; manual operator actions stay in the shared note (R18). | — |
| R07 / D08, R18, N01, N02, D26 | Respected. | — |

## ⚠️ Risks

| Risk | Level | Impact | Mitigation |
|------|-------|--------|------------|
| Own auth module (sessions, OAuth, locking, throttle) | High | Security defects in hand-written protocol code | Mitigated in spec: explicit transactions, user lock/re-read, real-PostgreSQL concurrency and rollback e2e, fake GitHub with state/PKCE error cases; review loop per phase PR. |
| Deployment target turns out serverless | Medium | CLI, cleanup and IP trust need redesign | Explicit assumption, re-checked at Phase 4 gate. |
| `authInterrupts` is experimental | Medium | `forbidden()` behaviour may change on upgrade | Pinned Next version, direct-HTTP 403 tests. |
| D30's premise lapses (1.0 gains email notifications) | Low | Password rules revisited | D30 review trigger. |

## 🔍 Gaps

- **Nice-to-have** — N1: load `auth-config` via dynamic `await import()` inside the
  `NEXT_RUNTIME === "nodejs"` branch of `instrumentation.ts`, so it never enters an edge bundle
  (Phase 2 step 5).
- **Nice-to-have** — N2: the brief's R06 and D07 rows still name "founder A (Oliwia)" in their
  owner column while their change path names the product owner (the same owner wording appears
  across the brief). Align the owner columns if the product owner wants the brief to name
  approvers rather than source authors; this does not affect the spec.

## 📋 Remediation plan

1. **Before implementation** — nothing.
2. **During implementation (add to the plan)** — N1 in Phase 2 step 5.
3. **After implementation (follow-up)** — N2 if wanted; the spec's launch-blocking follow-ups
   (GDPR deletion, deployment target) and the tracker drafts (#20 AC, #14 note, GDPR issue,
   `D07-login.md` request issue).

## 🧪 Audit limits

- Read the full spec at `af7486f`, `product-brief.md`, `backlog.md`, the decision records in
  `.ai/specs/research/decisions/`, `BACKWARD_COMPATIBILITY.md`, `CODE_REVIEW.md`, `AGENTS.md`,
  `SDLC.md` (no spec statuses defined; built-in R1 rule applied), `.ai/specs/README.md`,
  `.ai/lessons.md` (incl. the new product-owner lesson), the run journal and
  `.ai/agentic.config.json`. No repo-local override of this skill exists.
- Code inspection was not repeated line by line: no code changed since the earlier audits, which
  inspected the app container, health route and service, `next.config.ts`, layouts,
  `packages/app/package.json`, core/db exports, e2e sources, `om-sandbox.toml`, Next 16.4.6 docs
  and `base-server.js`.
- Decision authority follows the product owner's statement (2026-11-27) that they approve product
  decisions; the brief's owner columns were not treated as approvers.
- No validation commands were run (read-only audit, no implementation). No `.uxproof/` design
  contract exists. PR #30 discussion was not read beyond its state.
- No suspected prompt injection found.
