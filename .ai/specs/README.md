# Specs (Spec-Driven Development)

Specifications are written **before** implementation. Code follows the spec; if reality diverges, update the spec.

## Naming

`YYYY-MM-DD-slug.md` — date is the spec's creation date; slug is lowercase kebab-case (e.g. `2026-11-23-user-onboarding-flow.md`).

## Layout & lifecycle

```
.ai/specs/
  YYYY-MM-DD-slug.md     # active specs (draft / in implementation)
  implemented/           # fully implemented specs (moved here, filename unchanged)
  archive/               # abandoned or superseded specs (moved here, filename unchanged)
  capabilities/          # living capability specs: current behavior, one file per area (<slug>.md)
```

1. Create the spec in `.ai/specs/`.
2. Implement against it; link it from the task's run journal in `.ai/runs/`.
3. When implementation is complete, move it to `implemented/`.
4. If dropped or superseded, move it to `archive/` and note why at the top of the file.

When moving a spec, update links to it (e.g. in run journals).

## Capability specs

A spec that changes observable behavior carries a `## 📝 Delta` (ADDED / MODIFIED / REMOVED
requirements with `WHEN`/`THEN` scenarios). The implementation PR applies it to
`capabilities/<slug>.md`, so those files describe what the system does **now**, while the dated
specs stay the history of each change. Each requirement ends with `Source:` linking the spec that
last changed it.

## Suggested structure

- **Goal / problem**
- **Scope & non-goals**
- **Design / behavior**
- **Acceptance criteria**
- **Open questions**
