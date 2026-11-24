import "server-only";

import { asClass, asValue, createDiContainer, type AwilixContainer } from "@devmentor/core/di";
import { globalSingleton } from "@devmentor/core/singleton";
import { getOrm, type EntityManager, type MikroORM } from "@devmentor/db";
import { cache } from "react";

import { HealthService } from "./services/health-service";

/**
 * Everything resolvable from the DI container. Add new registrations here and in
 * `buildContainer()` / `createRequestScope()`.
 */
export interface Cradle {
  /** Process-wide ORM (singleton). Do not use `orm.em` for request work. */
  orm: MikroORM;
  /** Request-scoped EntityManager (an `orm.em.fork()`), only available in a request scope. */
  em: EntityManager;
  healthService: HealthService;
}

export type AppContainer = AwilixContainer<Cradle>;

async function buildContainer(): Promise<AppContainer> {
  const container = createDiContainer<Cradle>();
  container.register({
    orm: asValue(await getOrm()),
    healthService: asClass(HealthService).scoped(),
  });
  return container;
}

/** Root (process-wide) container, created once per Node.js process and HMR-safe. */
export function getContainer(): Promise<AppContainer> {
  return globalSingleton("devmentor:container", buildContainer);
}

/** Creates a fresh request scope with its own EntityManager (identity map / unit of work). */
export async function createRequestScope(): Promise<AppContainer> {
  const root = await getContainer();
  const scope = root.createScope();
  scope.register({ em: asValue(root.cradle.orm.em.fork()) });
  return scope;
}

/**
 * Request-scoped container for Server Components, Server Actions and Route Handlers.
 * Memoized per request with React `cache`, so every component in one render shares
 * the same scope (and EntityManager).
 */
export const getRequestContainer = cache(createRequestScope);
