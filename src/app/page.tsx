import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 48, fontFamily: "system-ui" }}>
      <h1>Google Creator OS</h1>
      <p>One automation layer for Gmail, Drive, Photos, YouTube, Ads and the wider Google ecosystem.</p>
      {user ? (
        <p><a href="/dashboard">Open dashboard</a></p>
      ) : (
        <p><a href="/api/auth/google?services=gmail,drive,photos,youtube,calendar,sheets,analytics,search_console">Continue with Google</a></p>
      )}
    </main>
  );
}
