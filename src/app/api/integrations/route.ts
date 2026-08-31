import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { SERVICE_META } from "@/lib/google/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integrations = await db.integration.findMany({ where: { userId: user.id } });
  const connected = new Map(integrations.map((i) => [i.service, i]));

  return NextResponse.json({
    services: Object.entries(SERVICE_META).map(([service, meta]) => ({
      service,
      ...meta,
      status: connected.get(service as never)?.status ?? "DISCONNECTED",
      googleEmail: connected.get(service as never)?.googleEmail ?? null,
      lastSyncAt: connected.get(service as never)?.lastSyncAt ?? null,
      lastError: connected.get(service as never)?.lastError ?? null,
    })),
  });
}
