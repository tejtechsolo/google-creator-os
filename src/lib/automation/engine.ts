import { db } from "@/lib/prisma";
import { gmailClient, driveClient, sheetsClient } from "@/lib/google/services";

type Action = { type: string; config?: Record<string, unknown> };

export async function enqueueAutomationRun(automationId: string, userId: string, triggerData: unknown) {
  return db.automationRun.create({
    data: { automationId, userId, triggerData, status: "QUEUED" },
  });
}

export async function executeAutomationRun(runId: string) {
  const run = await db.automationRun.findUnique({ include: { automation: true } , where: { id: runId } });
  if (!run) throw new Error("Automation run not found");
  if (run.status !== "QUEUED") return run;

  await db.automationRun.update({ where: { id: runId }, data: { status: "RUNNING", startedAt: new Date(), error: null } });
  const results: unknown[] = [];

  try {
    for (const action of (run.automation.actions as Action[])) {
      results.push(await executeAction(run.userId, action, run.triggerData));
    }
    const completed = await db.automationRun.update({
      where: { id: runId },
      data: { status: "SUCCEEDED", result: results, finishedAt: new Date() },
    });
    await db.auditLog.create({ data: { userId: run.userId, action: "automation.run.succeeded", resourceId: run.automationId, metadata: { runId } } });
    return completed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation action failed";
    const failed = await db.automationRun.update({ where: { id: runId }, data: { status: "FAILED", error: message, finishedAt: new Date() } });
    await db.auditLog.create({ data: { userId: run.userId, action: "automation.run.failed", resourceId: run.automationId, metadata: { runId, error: message } } });
    return failed;
  }
}

async function executeAction(userId: string, action: Action, triggerData: unknown) {
  switch (action.type) {
    case "GMAIL_LIST": {
      const gmail = await gmailClient(userId);
      const response = await gmail.users.messages.list({ userId: "me", maxResults: Number(action.config?.maxResults ?? 10), q: String(action.config?.query ?? "in:anywhere") });
      return { type: action.type, messages: response.data.messages ?? [] };
    }
    case "DRIVE_LIST": {
      const drive = await driveClient(userId);
      const response = await drive.files.list({ pageSize: Number(action.config?.pageSize ?? 20), orderBy: "modifiedTime desc", fields: "files(id,name,mimeType,modifiedTime,webViewLink)", q: "trashed = false" });
      return { type: action.type, files: response.data.files ?? [] };
    }
    case "SHEETS_APPEND": {
      const spreadsheetId = String(action.config?.spreadsheetId ?? "");
      const range = String(action.config?.range ?? "Sheet1");
      const values = (action.config?.values ?? [triggerData]) as unknown[][];
      if (!spreadsheetId) throw new Error("SHEETS_APPEND requires spreadsheetId");
      const sheets = await sheetsClient(userId);
      const response = await sheets.spreadsheets.values.append({ spreadsheetId, range, valueInputOption: "USER_ENTERED", requestBody: { values } });
      return { type: action.type, updatedRange: response.data.updates?.updatedRange ?? null };
    }
    case "AUDIT":
      await db.auditLog.create({ data: { userId, action: String(action.config?.action ?? "automation.action"), metadata: { triggerData } } });
      return { type: action.type, ok: true };
    case "APPROVAL_REQUIRED":
      return { type: action.type, status: "approval_required" };
    default:
      throw new Error(`Unsupported automation action: ${action.type}`);
  }
}
