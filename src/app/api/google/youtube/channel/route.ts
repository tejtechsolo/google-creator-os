import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { youtubeClient } from "@/lib/google/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const youtube = await youtubeClient(user.id);
    const channels = await youtube.channels.list({ part: ["snippet", "statistics", "contentDetails"], mine: true });
    return NextResponse.json({ channels: channels.data.items ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "YouTube request failed" }, { status: 502 });
  }
}
