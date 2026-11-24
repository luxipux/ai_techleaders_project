import type { EntitySchema } from "@mikro-orm/postgresql";

export { baseProperties } from "./base";

/**
 * Entity registry: every entity must be listed here so both the app runtime and the
 * MikroORM CLI (migrations) discover it. Define entities with `defineEntity` + `p`
 * in `./<name>.ts`, export the class, and add its schema below.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const entities: EntitySchema<any>[] = [];
