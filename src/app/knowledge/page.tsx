import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>
    <div className="page-heading"><span className="kicker">Knowledge OS</span><h1>Knowledge</h1><p className="muted">Workbooks, documents, research and reusable knowledge in one source of truth.</p></div>
    <div className="grid cards-3">
      <div className="card"><h3>Workbooks</h3><p className="muted">Structured workspaces with version history.</p></div>
      <div className="card"><h3>Research</h3><p className="muted">Capture and organize research before publishing.</p></div>
      <div className="card"><h3>Documents</h3><p className="muted">Reusable documents and templates.</p></div>
    </div>
  </AppShell>;
}
