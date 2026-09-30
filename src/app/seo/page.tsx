import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SEOIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}><div className="page-heading"><span className="kicker">SEO Intelligence</span><h1>SEO Intelligence</h1><p className="muted">Audit, understand and remediate technical and content opportunities using owned site and Search Console data.</p></div><div className="grid cards-3"><div className="card"><h3>Overview</h3><p className="muted">Workspace foundation is ready for the next feature module.</p></div><div className="card"><h3>Human approval</h3><p className="muted">External or irreversible actions remain behind explicit approval.</p></div><div className="card"><h3>Audit trail</h3><p className="muted">Important operations will be recorded for traceability.</p></div></div></AppShell>;
}
