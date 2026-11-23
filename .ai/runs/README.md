# Runs (task journals)

Task journals for work done with AI. **One file per task**, updated incrementally.

## Rules

- Create `.ai/runs/YYYY-MM-DD-slug.md` as part of the task's **first commit**. The date in the filename is the task's start date. Do not rename the file or create a new one for another session, even if the work spans several days.
- Keep a **fixed header** at the top with the task goals, a link to the specification (if one exists), and a line containing `Status: in-progress` or `Status: done`. Update the goals and status in this header. Set `done` only when the task is complete.
- For **every commit**, append a 2–5-line entry at the end of the same file: the date, what this commit covers, decisions or pitfalls encountered, and what remains to be done. Do not change earlier entries. Prepare the entry before committing and include it in the same commit as the changes it describes. Do not postpone logging until the end of the session.
- When **resuming** the task or taking it over from another person, read the existing journal and continue in the same file.

## Template

```markdown
# <Task title>

Goals:
- <goal 1>
- <goal 2>

Spec: [YYYY-MM-DD-slug](../specs/YYYY-MM-DD-slug.md)   <!-- or: none -->
Status: in-progress

---

## YYYY-MM-DD
- Covers: <what this commit does>
- Decisions/pitfalls: <choices made, gotchas>
- Remaining: <what is left>
```

Note: `.ai/cezar/` is managed by the sandbox tooling and is unrelated to this folder.
