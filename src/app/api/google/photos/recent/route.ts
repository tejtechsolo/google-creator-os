import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getGoogleClient } from "@/lib/google/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const auth = await getGoogleClient(user.id, "PHOTOS");
    const response = await auth.request<{ mediaItems?: unknown[] }>({
      url: "https://photoslibrary.googleapis.com/v1/mediaItems",
      method: "GET",
      params: { pageSize: 20 },
    });
    return NextResponse.json({ mediaItems: response.data.mediaItems ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Photos request failed" }, { status: 502 });
  }
}
