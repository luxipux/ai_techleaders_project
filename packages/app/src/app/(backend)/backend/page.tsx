import { Badge } from "@devmentor/ui/components/badge";
import { Button } from "@devmentor/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/card";
import { Activity, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { getHealthReport } from "@/server/health";

// `title.template` from ./layout only applies to child segments, not to this page (same segment).
export const metadata: Metadata = { title: { absolute: "Dashboard · DevMentor Backend" } };

export default async function BackendDashboardPage() {
  await connection();
  const health = await getHealthReport();
  const ok = health.status === "ok";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">System overview for DevMentor operators.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" /> Application
            </CardTitle>
            <CardDescription>
              Overall health as reported by <code className="font-mono">/api/health</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant={ok ? "default" : "destructive"}>{ok ? "Healthy" : "Degraded"}</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/health" prefetch={false}>
                Raw JSON
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4" /> PostgreSQL
            </CardTitle>
            <CardDescription>MikroORM connection pool, resolved through the DI container.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <Badge variant={health.database === "up" ? "secondary" : "destructive"}>
              {health.database === "up" ? "Connected" : "Unreachable"}
            </Badge>
            <span className="text-muted-foreground">
              {health.latencyMs} ms · {new Date(health.checkedAt).toLocaleTimeString("en-GB")}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
