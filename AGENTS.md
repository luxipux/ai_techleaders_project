<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guide

Next.js 16 / React 19 / TypeScript app. Commands: `npm run dev`, `npm run build`, `npm run lint`.

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
- **Verify every change.** Don't claim work is done until you've checked it. At minimum, run `npm run lint` and `npm run build`. For UI or runtime changes, run the app and confirm the behavior (see the `workspace-agent` skill). Report failures honestly, and record what you verified in the journal entry.
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
  runs/                      # task journals: YYYY-MM-DD-slug.md (one per task)
  lessons.md                 # index of lessons learned (read first)
  lessons/                   # detailed lessons: YYYY-MM-DD-slug.md
  cezar/                     # sandbox-managed; do not edit
```

Details and templates: `.ai/specs/README.md`, `.ai/runs/README.md`, `.ai/lessons/README.md`.
