# Override om-code-review for DevMentor

Goals:
- Override the installed `om-code-review` skill through the repo-local override (`.ai/skills/om-code-review/SKILL.md`, same name), without touching `.agents/skills/`.
- Add DevMentor rules: gate also under `NODE_ENV=test`; build in `/workspace`; trial merge for stacked PRs; read `.ai/lessons.md` before review; "Lessons check" section at the end of the report.

Spec: none (course exercise; a small config change, no behaviour of the app)
Status: in-progress

---

## 2026-11-26
- Covers: full copy of `.agents/skills/om-code-review/SKILL.md` to `.ai/skills/om-code-review/SKILL.md` with the five DevMentor changes (marked `DevMentor:`). The original is untouched.
- Decisions/pitfalls: only `SKILL.md` is copied; its `references/` links point to the installed skill so the shared checklists have one source and cannot drift. The self-referencing "ALWAYS check first" line is replaced by a note that this file is the override. All changes only add gates, so they do not relax safety rules (the override contract forbids that). The trial merge runs in a throwaway worktree and is aborted; the reviewed branch is never modified.
- Remaining: PR via `om-open-pr`; the maintainer merges (no merge by the agent). Not exercised on a real stacked PR yet.
