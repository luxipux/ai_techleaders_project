@AGENTS.md

# Claude-specific reminders

The `.ai/` workflow in AGENTS.md is mandatory. In short:

- Start of task: read `.ai/lessons.md`, check `.ai/specs/`, and continue any existing journal in `.ai/runs/`.
- Specs: `.ai/specs/YYYY-MM-DD-slug.md` → move to `implemented/` or `archive/` when finished/dropped.
- Journal: create `.ai/runs/YYYY-MM-DD-slug.md` in the task's first commit; append a 2–5-line entry **in every commit** (never edit earlier entries); keep the header's `Status:` current.
- Lessons: record bug fixes and non-obvious findings in `.ai/lessons/` and index them in `.ai/lessons.md`.
