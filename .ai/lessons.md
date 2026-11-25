# Lessons Learned

Long-term memory for LLM agents (and humans) working on this repo. **Read this file at the start of every task.**

## When to add a lesson

- After fixing a bug (root cause + how to avoid it).
- After discovering a non-obvious constraint, convention, or pitfall.
- After a correction from the user that should apply to future work.

## How to add a lesson

1. Create `.ai/lessons/YYYY-MM-DD-slug.md` (format: see [lessons/README.md](lessons/README.md)).
2. Add a one-line entry to the index below (newest last).
3. Do this in the same commit as the fix, and mention it in the run journal entry.

Don't duplicate: if a lesson already exists, update it instead.

## Index

<!-- Format: - [YYYY-MM-DD-slug](lessons/YYYY-MM-DD-slug.md) — one-line summary -->

- [2026-11-24-next-build-requires-production-node-env](lessons/2026-11-24-next-build-requires-production-node-env.md) — sandbox exports NODE_ENV=development; app build/start scripts must pin NODE_ENV=production
- [2026-11-24-next-env-cjs-esm-interop](lessons/2026-11-24-next-env-cjs-esm-interop.md) — `@next/env`: named import in next.config.ts, default import in ESM scripts/CLI configs
- [2026-11-24-mikro-orm-snapshot-name](lessons/2026-11-24-mikro-orm-snapshot-name.md) — pin `snapshotName`; default embeds the DB name and differs per developer
- [2026-11-24-shadcn-cn-package](lessons/2026-11-24-shadcn-cn-package.md) — shadcn components import `cn` from shadcn's `cn` package; keep it, re-export via `@devmentor/ui/lib/utils`
- [2026-11-24-next-title-template-scope](lessons/2026-11-24-next-title-template-scope.md) — a layout's `title.template` skips the page in its own segment; use `title.absolute` there
- [2026-11-25-skills-untracked-on-main](lessons/2026-11-25-skills-untracked-on-main.md) — skills now live on main (`.claude/skills/*` symlinks to `.agents/skills/*`, ESLint-ignored); never restore them by copying
