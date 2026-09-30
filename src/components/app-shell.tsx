import Link from "next/link";
import type { ReactNode } from "react";

const groups = [
  { title: "Workspace", items: [["Dashboard", "/dashboard"], ["Knowledge", "/knowledge"], ["Content", "/content"], ["SEO", "/seo"]] },
  { title: "Publishing", items: [["Social", "/social"], ["YouTube", "/youtube"], ["Google", "/google"], ["Media", "/media"]] },
  { title: "Intelligence", items: [["AI", "/ai"], ["Automation", "/automation"], ["Analytics", "/analytics"]] },
  { title: "System", items: [["Integrations", "/integrations"], ["Settings", "/settings"], ["Docs", "/docs"]] },
] as const;

export function AppShell({ children, user }: { children: ReactNode; user: { name: string | null; email: string } }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">Google Creator OS</Link>
        <div className="sidebar-scroll">
          {groups.map((group) => (
            <section key={group.title} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              {group.items.map(([label, href]) => <Link key={href} href={href} className="side-link">{label}</Link>)}
            </section>
          ))}
        </div>
        <div className="sidebar-user"><strong>{user.name ?? "Account"}</strong><span>{user.email}</span><Link href="/api/auth/logout">Sign out</Link></div>
      </aside>
      <div className="app-main"><header className="app-topbar"><span>Workspace</span><Link href="/settings">Settings</Link></header><main className="app-content">{children}</main></div>
    </div>
  );
}
