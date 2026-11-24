# `title.template` does not apply to the page in the same segment

## Context
The first agent-browser integration run found `/backend` titled `Dashboard · DevMentor`.
The intended title was `Dashboard · DevMentor Backend`: `backend/layout.tsx` defines the template
`%s · DevMentor Backend` and `backend/page.tsx` sets `title: "Dashboard"`.

## Finding
Next.js applies a layout's `title.template` only to **child** route segments
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`).
A `page.tsx` next to that `layout.tsx` is in the same segment, so the parent template applies
instead (root: `%s · DevMentor`). Unit tests on `metadata` objects can't catch this. Only the
rendered `<title>` shows it.

## Lesson / How to apply
- For the index page of a section whose layout defines a template, use `title: { absolute: "…" }`.
  Pages in nested folders (`backend/users/page.tsx`) get the template automatically.
- Assert rendered titles in integration tests (`browser.title()`), not only `metadata` in unit tests.

Related: [run journal](../runs/2026-11-24-testing-and-ci.md)
