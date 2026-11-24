# `@next/env` import style differs between next.config.ts and ESM scripts

## Context
Both `packages/app/next.config.ts` and `packages/db/mikro-orm.config.ts` load root env files with `@next/env`.

## Finding
`@next/env` is a bundled CommonJS module.
- `next.config.ts` is compiled to CJS. There, `import nextEnv from "@next/env"` gives `undefined` for the default export.
- Under real ESM (the MikroORM CLI through `tsx`, `"type": "module"`), the named import fails instead:
  `does not provide an export named 'loadEnvConfig'`.

## Lesson / How to apply
- In `next.config.ts`, use `import { loadEnvConfig } from "@next/env"`.
- In ESM scripts and CLI configs, use `import nextEnv from "@next/env"` and then `nextEnv.loadEnvConfig(...)`.
- Run the actual consumer (`next typegen`, `npx mikro-orm debug`) to verify. `tsc` accepts both forms.

Related: [run journal](../runs/2026-11-24-monorepo-foundation.md)
