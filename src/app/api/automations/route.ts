import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const automations = await db.automation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ automations });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.trigger || !Array.isArray(body?.actions)) {
    return NextResponse.json({ error: "name, trigger and actions are required" }, { status: 400 });
  }
  const automation = await db.automation.create({
    data: {
      userId: user.id,
      name: String(body.name),
      description: body.description ? String(body.description) : undefined,
      trigger: body.trigger,
      actions: body.actions,
      schedule: body.schedule ? String(body.schedule) : undefined,
      status: body.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
    },
  });
  return NextResponse.json({ automation }, { status: 201 });
}
