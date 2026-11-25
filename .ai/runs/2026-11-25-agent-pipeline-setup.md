# Agent PR pipeline setup

Goals:
- Configure `.ai/agentic.config.json` for the om-* skills (GitHub tracker, agent-browser, lint/typecheck/coverage/build gate, full label taxonomy, QA gate on)
- Install the tracker and browser descriptors and generate SDLC.md, CODE_REVIEW.md, BACKWARD_COMPATIBILITY.md
- Automerge mode `prepare-to-merge`: the maintainer merges every PR

Spec: none
Status: done

---

## 2026-11-25
- Covers: `.ai/agentic.config.json`; `.ai/trackers/github.md`, `.ai/browsers/agent-browser.md`; `SDLC.md` (rendered from the shipped template, discovery blocks stripped); `CODE_REVIEW.md` and `BACKWARD_COMPATIBILITY.md` derived from CLAUDE.md, the ESLint boundary rules and the real entry points; `.gitignore` entries for `.ai/qa` per-run state; `.gitkeep` in `.ai/analysis`, `.ai/scripts`, `.ai/qa`. 33 taxonomy labels created on GitHub (`bug`, `documentation` already existed, untouched).
- Decisions/pitfalls: `jq` was missing (the descriptor guards and config snippets need it) and installed via apt; `gh` 2.65.0 upgraded to 2.105.0 from GitHub's apt repo. `automerge.mode` set to `prepare-to-merge`. The branch is cut from `origin/main`, not from the local `feat/testing-ci`, because that branch was already merged via PR #2. The local `main` is stale and was not touched.
- Verified: config parses (python3 JSON check), `om-setup`'s coverage check prints `SKILL_COVERAGE_OK`, all taxonomy labels read back from GitHub. The validation gate was not run: this change is configuration and docs only, with no code.
- Remaining: maintainer reviews and merges the PR. Upcoming: `npx agent-browser install` for local browser QA; the generated docs need a human read-through before they are treated as authoritative.
