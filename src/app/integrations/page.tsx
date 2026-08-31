import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/prisma";
import { SERVICE_META } from "@/lib/google/services";

export default async function IntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) return <main style={{ padding: 40 }}>Please connect your Google account first.</main>;

  const connected = await db.integration.findMany({ where: { userId: user.id } });
  const map = new Map(connected.map((item) => [item.service, item]));

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 40, fontFamily: "system-ui" }}>
      <h1>Google Integrations</h1>
      <p>Connect services incrementally. Google recommends requesting scopes when a feature needs them.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 24 }}>
        {Object.entries(SERVICE_META).map(([service, meta]) => {
          const integration = map.get(service as never);
          const connectedNow = integration?.status === "CONNECTED";
          return (
            <section key={service} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 18 }}>
              <h2 style={{ marginTop: 0 }}>{meta.label}</h2>
              <p>{meta.description}</p>
              <strong>{connectedNow ? "Connected" : "Not connected"}</strong>
              {connectedNow && integration?.googleEmail ? <p>{integration.googleEmail}</p> : null}
              {!connectedNow ? (
                <a href={`/api/auth/google?services=${service.toLowerCase()}`}>Connect</a>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
