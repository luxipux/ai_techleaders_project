# Publish om-* agent skills to main

Goals:
- Put the `om-*` skills (and `skills-lock.json`) on `main`, so the pipeline config in `.ai/agentic.config.json` has the skills it references
- Keep `npm run lint` green on `main`

Spec: none
Status: done

---

## 2026-11-25
- Covers: the two local commits `om-skills-installation` and `om-skills-update` (previously only on the unpushed local `feat/testing-ci`), cherry-picked onto `origin/main`, plus ESLint `globalIgnores` for `.agents/**` and `.claude/**`. Pushed directly to `main` on the maintainer's explicit instruction.
- Decisions/pitfalls: without the ignore, `npm run lint` fails on a parse error in `.agents/skills/om-ux-design/references/assets/comments.js`. The cherry-pick was done in a separate worktree so the working directory with PR #3 was untouched. PR #3 (`chore/agent-pipeline-setup`) does not touch skills, so it merges without conflict.
- Verified: see the commit message; lint run in the clean worktree.
- Remaining: PR #3 is still open for the maintainer to merge; its journal and lesson refer to the skills being absent from `main`, which is no longer true after this push.
