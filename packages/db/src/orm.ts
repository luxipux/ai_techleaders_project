import { clearGlobalSingleton, globalSingleton, peekGlobalSingleton } from "@devmentor/core/singleton";
import { MikroORM, type Options } from "@mikro-orm/postgresql";

import { createOrmConfig } from "./config";

const ORM_KEY = "devmentor:orm";

/**
 * Returns the process-wide MikroORM instance (one connection pool per process),
 * initializing it on first use. Safe across `next dev` hot reloads.
 *
 * Never use `orm.em` directly for request work — fork it (`orm.em.fork()`), or use the
 * request-scoped `em` from the DI container.
 */
export function getOrm(overrides?: Partial<Options>): Promise<MikroORM> {
  return globalSingleton(ORM_KEY, () => MikroORM.init(createOrmConfig(overrides)));
}

/** Closes the pool and forgets the instance (scripts, tests, graceful shutdown). */
export async function closeOrm(): Promise<void> {
  const orm = await peekGlobalSingleton<Promise<MikroORM>>(ORM_KEY)?.catch(() => undefined);
  clearGlobalSingleton(ORM_KEY);
  await orm?.close(true);
}
