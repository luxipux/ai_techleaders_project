import "server-only";

import { pingDatabase } from "@devmentor/db";

import type { Cradle } from "../container";

export interface HealthReport {
  status: "ok" | "degraded";
  database: "up" | "down";
  latencyMs: number;
  checkedAt: string;
}

/** Reports application health; used by `/api/health` and the backend dashboard. */
export class HealthService {
  readonly #em: Cradle["em"];

  constructor({ em }: Pick<Cradle, "em">) {
    this.#em = em;
  }

  async check(): Promise<HealthReport> {
    const startedAt = performance.now();
    const databaseUp = await pingDatabase(this.#em);
    return {
      status: databaseUp ? "ok" : "degraded",
      database: databaseUp ? "up" : "down",
      latencyMs: Math.round(performance.now() - startedAt),
      checkedAt: new Date().toISOString(),
    };
  }

  /** Report used when the container itself cannot be built (e.g. DB unreachable at startup). */
  static unavailable(): HealthReport {
    return { status: "degraded", database: "down", latencyMs: 0, checkedAt: new Date().toISOString() };
  }
}
