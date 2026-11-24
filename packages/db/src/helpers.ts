import type { EntityManager } from "@mikro-orm/postgresql";

/** Cheap connectivity probe (`select 1`) used by health checks. */
export async function pingDatabase(em: EntityManager): Promise<boolean> {
  try {
    await em.getConnection().execute("select 1");
    return true;
  } catch {
    return false;
  }
}

/** Offset pagination input, clamped to sane bounds. */
export function toPagination(page = 1, pageSize = 20, maxPageSize = 100) {
  const size = Math.min(Math.max(1, Math.trunc(pageSize)), maxPageSize);
  const current = Math.max(1, Math.trunc(page));
  return { limit: size, offset: (current - 1) * size };
}
