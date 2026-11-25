# Skills were missing from `origin/main` (now fixed): do not restore them by hand

## Context
Setting up the agent pipeline, the PR branch was cut from `origin/main` while the `om-*` skills were
still committed only on the local, unpushed `feat/testing-ci`. After the switch `.claude/skills/` held
only `workspace-agent`, and `/om-open-pr` was "Unknown skill". The skills were then copied back with
`git archive … | tar -x`, which left 148 untracked paths and a lint failure.

## Finding
- The skills are now on `main`: real files in `.agents/skills/<name>/`, and `.claude/skills/<name>` is
  a symlink to `../../.agents/skills/<name>` (75 entries, `workspace-agent` included).
- `eslint.config.mjs` ignores `.agents/**` and `.claude/**`. Before that, `npm run lint` failed on a
  parse error in `.agents/skills/om-ux-design/references/assets/comments.js`.
- A skill directory that appears mid-session is not registered as a skill. Read its `SKILL.md` and
  follow it by hand, or restart the session.

## Lesson / How to apply
- Never restore skills by copying them into the working tree; copies show up as untracked files and
  break the "clean tree" state. Branch from a base that tracks them, or merge `origin/main`.
- Keep the layout: edit skills only under `.agents/skills/`; `.claude/skills/*` stays a symlink.
- Check before branching from an old base: `git ls-tree origin/main .claude/skills/`.
- Run the validation gate (lint, typecheck, test:coverage, build) even for config/docs-only PRs;
  AGENTS.md makes it the definition of done.

Related: [run journal](../runs/2026-11-25-agent-pipeline-setup.md),
[publishing journal](../runs/2026-11-25-publish-skills-to-main.md)
