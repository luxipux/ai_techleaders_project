import { createContainer, InjectionMode, type AwilixContainer } from "awilix";

/**
 * Awilix primitives re-exported so packages depend on `@devmentor/core/di`
 * rather than on `awilix` directly (single place to swap/extend DI behaviour).
 */
export {
  aliasTo,
  asClass,
  asFunction,
  asValue,
  InjectionMode,
  Lifetime,
  type AwilixContainer,
  type InferCradleFromResolvers,
  type Resolver,
} from "awilix";

/**
 * Creates a DI container with the project defaults:
 * - `PROXY` injection mode: dependencies arrive as one destructured cradle object
 *   (`constructor({ em, logger })`), which survives minification.
 * - `strict` mode: e.g. a singleton cannot depend on a scoped registration.
 */
export function createDiContainer<Cradle extends object>(): AwilixContainer<Cradle> {
  return createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });
}
