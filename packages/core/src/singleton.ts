const registry = globalThis as typeof globalThis & {
  __devmentorSingletons?: Map<string, unknown>;
};

/**
 * Returns a process-wide singleton stored on `globalThis`.
 *
 * Module-level variables are re-created on every hot reload in `next dev`, which
 * would leak DB pools and containers. Storing them on `globalThis` keeps exactly one
 * instance per Node.js process. Async factories are memoized as promises, so
 * concurrent callers share the same initialization. A rejected promise is evicted
 * so the next call can retry.
 */
export function globalSingleton<T>(key: string, factory: () => T): T {
  const store = (registry.__devmentorSingletons ??= new Map<string, unknown>());
  if (store.has(key)) return store.get(key) as T;

  const value = factory();
  store.set(key, value);
  if (value instanceof Promise) {
    value.catch(() => {
      if (store.get(key) === value) store.delete(key);
    });
  }
  return value;
}

/** Returns an existing singleton without creating it. */
export function peekGlobalSingleton<T>(key: string): T | undefined {
  return registry.__devmentorSingletons?.get(key) as T | undefined;
}

/** Removes a singleton created by {@link globalSingleton} (e.g. after closing a resource). */
export function clearGlobalSingleton(key: string): void {
  registry.__devmentorSingletons?.delete(key);
}
