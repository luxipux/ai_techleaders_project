/**
 * Class-name merging for Tailwind (conditional classes + conflict resolution):
 * `cn("p-2", isBig && "p-4")` → `"p-4"`.
 *
 * Re-exports shadcn's `cn` package, which the shadcn registry components import directly,
 * so app code and generated components share one implementation.
 */
export { cn, type ClassValue } from "cn";
