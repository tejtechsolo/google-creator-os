import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

const services = [
  "GMAIL", "DRIVE", "PHOTOS", "YOUTUBE", "ADS", "CALENDAR", "SHEETS",
  "ANALYTICS", "SEARCH_CONSOLE", "BUSINESS_PROFILE", "CONTACTS", "TASKS", "DOCS", "FORMS",
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const integrations = await db.integration.findMany({ where: { userId: user.id } });
  const connected = new Set(integrations.filter((x) => x.status === "CONNECTED").map((x) => x.service));

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32, fontFamily: "system-ui" }}>
      <h1>Google Creator OS</h1>
      <p>Welcome, {user.name ?? user.email}.</p>
      <h2>Integrations</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        {services.map((service) => (
          <div key={service} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
            <strong>{service.replaceAll("_", " ")}</strong>
            <div>{connected.has(service) ? "Connected" : "Not connected"}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24 }}>
        <a href="/api/auth/google?services=gmail,drive,photos,youtube,calendar,sheets,analytics,search_console">Connect Google services</a>
        {" · "}
        <a href="/api/auth/logout">Sign out</a>
      </p>
    </main>
  );
}
