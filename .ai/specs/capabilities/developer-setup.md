# Capability: developer-setup

A contributor gets a working DevMentor checkout with one re-runnable command, `npm run setup`.

## Requirement: One-command setup
The system SHALL provide `npm run setup` that installs dependencies, ensures a database configuration,
and applies pending migrations, then prints the next command to start the app.

### Scenario: Fresh clone with a reachable database
- WHEN a contributor runs `npm run setup` in a fresh clone with no `node_modules`, no `.env.local`, no
  `DATABASE_URL` in the environment, and PostgreSQL reachable at the `.env.example` default
- THEN dependencies are installed, `.env.local` is created from `.env.example`, migrations are
  applied, the output ends with `Next: npm run dev`, and the exit code is 0

Source: .ai/specs/implemented/2026-11-25-npm-run-setup-installer.md

## Requirement: Idempotent re-run
The system SHALL skip every step whose result is already in place, and a run with nothing to do SHALL
change no file and exit 0.

### Scenario: Second run on a ready checkout
- WHEN `npm run setup` runs again without any change since the previous successful run
- THEN dependencies and `.env.local` are reported as skipped, `npm install` is not invoked,
  `.env.local` is byte-for-byte unchanged, and the exit code is 0

### Scenario: Lockfile changed after a pull
- WHEN `package-lock.json` or a workspace `package.json` changes so that it no longer matches the
  installed tree
- THEN setup runs `npm install` and reports dependencies as installed

Source: .ai/specs/implemented/2026-11-25-npm-run-setup-installer.md

## Requirement: Never overwrite local configuration
The system SHALL NOT modify an existing `.env.local`, and SHALL NOT create one when `DATABASE_URL` is
already provided by the environment or another env file.

### Scenario: Edited `.env.local`
- WHEN `.env.local` exists with a user-edited `DATABASE_URL`
- THEN setup leaves the file untouched and uses that value

### Scenario: `DATABASE_URL` from the shell
- WHEN `DATABASE_URL` is set in the environment and `.env.local` is absent
- THEN setup does not create `.env.local` and reports that the value comes from the environment

Source: .ai/specs/implemented/2026-11-25-npm-run-setup-installer.md

## Requirement: Actionable failures without secrets
The system SHALL stop at the first failing step with exit code 1 and a message naming the fix, and
SHALL never print a database password.

### Scenario: Unsupported Node.js
- WHEN the running Node.js version does not satisfy `engines.node`
- THEN setup exits 1 before installing anything, naming the required and found versions

### Scenario: Unreachable database
- WHEN migrations fail because the database cannot be reached
- THEN setup exits 1, prints the redacted URL (`postgres://user:***@host:port/db`), and tells the user to
  start PostgreSQL or edit `DATABASE_URL` in the file it came from, then re-run `npm run setup`

### Scenario: Invalid `DATABASE_URL`
- WHEN `DATABASE_URL` is empty or not a `postgres:`/`postgresql:` URL
- THEN setup exits 1 without running migrations and names the file to edit

Source: .ai/specs/implemented/2026-11-25-npm-run-setup-installer.md
