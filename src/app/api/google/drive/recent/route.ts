import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { driveClient } from "@/lib/google/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const drive = await driveClient(user.id);
    const result = await drive.files.list({
      pageSize: 20,
      orderBy: "modifiedTime desc",
      fields: "files(id,name,mimeType,modifiedTime,webViewLink,size,thumbnailLink)",
      q: "trashed = false",
    });
    return NextResponse.json({ files: result.data.files ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Drive request failed" }, { status: 502 });
  }
}
