# MikroORM migration snapshot is named after the database by default

## Context
Testing `migration:create` produced `src/migrations/.snapshot-open-mercato.json`. The file was named after the local database.

## Finding
By default the snapshot file name embeds `dbName`. Developers with differently named databases
would each commit a different snapshot file, and schema diffs would drift apart.

## Lesson / How to apply
- `packages/db/mikro-orm.config.ts` pins `migrations.snapshotName: ".snapshot-devmentor"`. Keep it.
- Commit `.snapshot-devmentor.json` together with each migration.
- To check the generated SQL during experiments, use a throwaway entity. Delete the migration,
  the snapshot and the `mikro_orm_migrations` table afterwards.

Related: [run journal](../runs/2026-11-24-monorepo-foundation.md)
