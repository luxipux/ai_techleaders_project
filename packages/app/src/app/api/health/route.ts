import { connection } from "next/server";

import { getHealthReport } from "@/server/health";

export async function GET() {
  await connection();
  const report = await getHealthReport();
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
