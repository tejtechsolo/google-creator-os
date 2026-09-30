import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

const services = ["GMAIL","DRIVE","PHOTOS","YOUTUBE","ADS","CALENDAR","SHEETS","ANALYTICS","SEARCH_CONSOLE","BUSINESS_PROFILE","CONTACTS","TASKS","DOCS","FORMS"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const integrations = await db.integration.findMany({ where: { userId: user.id } });
  const connected = new Set(integrations.filter((x) => x.status === "CONNECTED").map((x) => x.service));
  return <AppShell user={user}>
    <div className="page-heading"><span className="kicker">Overview</span><h1>Good to see you, {user.name ?? user.email}</h1><p className="muted">Your creator workspace for knowledge, content, SEO, publishing, automation and analytics.</p></div>
    <div className="grid cards-3">
      <div className="card"><h3>Connected services</h3><p style={{fontSize:32,fontWeight:800,margin:"10px 0"}}>{connected.size}<span className="muted" style={{fontSize:16}}> / {services.length}</span></p><p className="muted">Google services currently connected.</p></div>
      <div className="card"><h3>Content pipeline</h3><p className="muted">Draft, review, schedule and publish with explicit approval gates.</p><a className="btn btn-primary" href="/content">Open Content</a></div>
      <div className="card"><h3>Traffic growth</h3><p className="muted">Use Search Console and Analytics evidence to identify measurable opportunities.</p><a className="btn" href="/seo">Open SEO</a></div>
    </div>
    <section className="section"><h2>Google connections</h2><div className="grid cards-3">{services.map((service)=><div key={service} className="card"><strong>{service.replaceAll("_"," ")}</strong><p className="muted">{connected.has(service) ? "Connected" : "Not connected"}</p></div>)}</div></section>
    <p><a className="btn btn-primary" href="/api/auth/google?services=gmail,drive,photos,youtube,calendar,sheets,analytics,search_console">Connect Google services</a></p>
  </AppShell>;
}
