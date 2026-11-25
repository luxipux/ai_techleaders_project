# Skills tracked on a feature branch vanish when you branch from `origin/main`

## Context
Setting up the agent pipeline, the PR branch was cut from `origin/main` (the local `feat/testing-ci`
was already merged upstream). After the switch `.claude/skills/` held only `workspace-agent`, and
`/om-open-pr` was "Unknown skill".

## Finding
The `om-*` skills are committed only on the local, unpushed `feat/testing-ci` commits
(`om-skills-installation`, `om-skills-update`). `origin/main` does not track them, so switching removes
them from the working tree. Also, `eslint.config.mjs` has no ignore for `.agents/` / `.claude/`, and
`.agents/skills/om-ux-design/references/assets/comments.js` has a parse error, so `npm run lint` fails
(1 error) whenever the skills are present in the tree. A skill directory that appears mid-session is
not registered as a skill either; read its `SKILL.md` and follow it by hand.

## Lesson / How to apply
- Before branching from `origin/main`, check `git ls-tree origin/main .claude/skills/`; restore needed
  skills with `git archive <branch> .claude/skills .agents/skills | tar -x --skip-old-files` and keep them untracked.
- Run lint for PR content with `npx eslint . --ignore-pattern '.agents/**' --ignore-pattern '.claude/**'`.
- Before pushing the skills commits to `main`, add `.agents/` and `.claude/` to the ESLint ignores, or CI lint fails.
- Run the validation gate (lint, typecheck, test:coverage, build) even for config/docs-only PRs; AGENTS.md
  makes it the definition of done.

Related: [run journal](../runs/2026-11-25-agent-pipeline-setup.md)
