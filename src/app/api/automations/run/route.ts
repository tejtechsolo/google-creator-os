import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { executeAutomationRun, enqueueAutomationRun } from "@/lib/automation/engine";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const automationId = String(body?.automationId ?? "");
  if (!automationId) return NextResponse.json({ error: "automationId is required" }, { status: 400 });

  const automation = await db.automation.findFirst({ where: { id: automationId, userId: user.id } });
  if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  if (automation.status !== "ACTIVE") return NextResponse.json({ error: "Automation must be ACTIVE" }, { status: 409 });

  const run = await enqueueAutomationRun(automation.id, user.id, body?.triggerData ?? { source: "manual" });
  const result = await executeAutomationRun(run.id);
  return NextResponse.json({ run: result });
}
