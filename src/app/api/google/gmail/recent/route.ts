import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { gmailClient } from "@/lib/google/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const gmail = await gmailClient(user.id);
    const list = await gmail.users.messages.list({ userId: "me", maxResults: 10, q: "in:anywhere" });
    const ids = list.data.messages ?? [];
    const messages = await Promise.all(ids.map(async ({ id }) => {
      if (!id) return null;
      const result = await gmail.users.messages.get({ userId: "me", id, format: "metadata", metadataHeaders: ["Subject", "From", "Date"] });
      const headers = result.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
      return { id, subject: get("Subject"), from: get("From"), date: get("Date"), snippet: result.data.snippet ?? "" };
    }));
    return NextResponse.json({ messages: messages.filter(Boolean) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gmail request failed" }, { status: 502 });
  }
}
