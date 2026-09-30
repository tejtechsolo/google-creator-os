"use client";

import { useEffect, useState } from "react";

type Member = { id: string; role: string; user: { id: string; email: string; name: string | null } };
type Invitation = { id: string; email: string; role: string; expiresAt: string };

const roles = ["ADMIN","EDITOR","SEO_ANALYST","CONTENT_MANAGER","VIEWER"];

export default function WorkspaceMembersPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(id = workspaceId) {
    if (!id) return;
    setLoading(true); setError("");
    const res = await fetch(`/api/workspaces/members?workspaceId=${encodeURIComponent(id)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Unable to load members."); setLoading(false); return; }
    setMembers(data.members); setInvitations(data.invitations); setLoading(false);
  }

  useEffect(() => {
    fetch("/api/workspaces").then((r) => r.json()).then((data) => {
      const first = data.workspaces?.[0];
      if (first) { setWorkspaceId(first.id); void load(first.id); }
      else setLoading(false);
    }).catch(() => { setError("Unable to load workspaces."); setLoading(false); });
  }, []);

  async function invite() {
    setError("");
    const res = await fetch("/api/workspaces/members", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ workspaceId, email, role }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Unable to send invitation."); return; }
    setEmail(""); await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this member from the workspace?")) return;
    const res = await fetch(`/api/workspaces/members/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Unable to remove member."); return; }
    await load();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Workspace members</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite collaborators and manage workspace access.</p>
      </header>
      {error && <p role="alert" className="rounded border p-3 text-sm">{error}</p>}
      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Invite a member</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input className="rounded border px-3 py-2" type="email" placeholder="person@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="rounded border px-4 py-2" disabled={!email || !workspaceId} onClick={invite}>Send invitation</button>
        </div>
      </section>
      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Members</h2>
        {loading ? <p className="mt-4 text-sm">Loading…</p> : (
          <div className="mt-4 divide-y">
            {members.map((member) => (
              <div className="flex items-center justify-between gap-4 py-3" key={member.id}>
                <div><p className="font-medium">{member.user.name || member.user.email}</p><p className="text-sm text-muted-foreground">{member.user.email}</p></div>
                <div className="flex items-center gap-3"><span className="text-sm">{member.role}</span>{member.role !== "OWNER" && <button className="text-sm underline" onClick={() => remove(member.id)}>Remove</button>}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      {invitations.length > 0 && <section className="rounded-xl border p-5"><h2 className="font-medium">Pending invitations</h2><div className="mt-4 divide-y">{invitations.map((item) => <div className="py-3 text-sm" key={item.id}>{item.email} · {item.role} · expires {new Date(item.expiresAt).toLocaleDateString()}</div>)}</div></section>}
    </main>
  );
}
