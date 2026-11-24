# shadcn registry components import `cn` from the `cn` npm package

## Context
`npx shadcn add button` wrote `import { cn } from "cn"` and added `cn` to `@devmentor/ui` dependencies, even though `components.json` aliases `utils` to `@devmentor/ui/lib/utils`.

## Finding
This is intended upstream behaviour, not a mis-resolved alias. Current shadcn registry items
depend on `cn`, shadcn's own package (maintainer `shadcn`, repo `shadcn-ui/cn`). It replaces
`clsx` + `tailwind-merge`.

## Lesson / How to apply
- Keep generated components as emitted (`from "cn"`), so future `shadcn add`/diffs stay clean.
- `@devmentor/ui/lib/utils` re-exports `cn` from `cn`. App code imports it from there. Don't re-add `clsx` or `tailwind-merge`.
- When a generator adds an unfamiliar dependency, check its provenance (`npm view <pkg> maintainers repository.url`) before removing or keeping it.

Related: [run journal](../runs/2026-11-24-monorepo-foundation.md)
