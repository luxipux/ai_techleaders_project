# `next build` fails when NODE_ENV=development is exported

## Context
Monorepo foundation task: `npm run build` failed while prerendering `/_global-error` with
`TypeError: Cannot read properties of null (reading 'useContext')` and a flood of React "key" warnings.

## Finding
The sandbox exports `NODE_ENV=development` globally. `next build` with a non-production `NODE_ENV`
mixes development and production React builds during prerendering. The error looks like a duplicate
React copy, but `npm ls react` showed only one.

## Lesson / How to apply
- The app's `build`/`start` scripts pin `NODE_ENV=production` (`packages/app/package.json`). Keep it.
- When a build fails with `useContext` of null, check `echo $NODE_ENV` before hunting duplicate React copies.

Related: [run journal](../runs/2026-11-24-monorepo-foundation.md)
