import "server-only";

import { getRequestContainer } from "./container";
import { HealthService, type HealthReport } from "./services/health-service";

/** Runs the health check, degrading gracefully if the ORM cannot even be initialized. */
export async function getHealthReport(): Promise<HealthReport> {
  try {
    const container = await getRequestContainer();
    return await container.cradle.healthService.check();
  } catch (error) {
    console.error("[health] container unavailable", error);
    return HealthService.unavailable();
  }
}
