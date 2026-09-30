import Link from "next/link";
import { PublicShell } from "@/components/public-site";

const features = [
  ["Knowledge OS","Organize workbooks, research, documents and versions."],
  ["Content Studio","Create, repurpose, review and schedule content."],
  ["SEO Intelligence","Audit websites and turn evidence into actionable fixes."],
  ["Multi-platform Publishing","Prepare platform-specific variants and publish after approval."],
  ["Google Workspace","Connect supported Google services from one workspace."],
  ["Automation & Analytics","Automate repeatable workflows and measure outcomes."]
];

export default function Home() {
 return <PublicShell><main>
  <section className="hero container"><span className="kicker">Creator & Knowledge Operating System</span><h1>Build, publish, optimize and grow from one secure workspace.</h1><p>Bring your knowledge, content, SEO, Google ecosystem, social distribution, automation and analytics into one reusable workflow.</p><div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}><Link className="btn btn-primary" href="/register">Start building</Link><Link className="btn" href="/products">Explore products</Link></div></section>
  <section className="section container"><div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))"}}>{features.map(([t,d])=><article className="card" key={t}><h3>{t}</h3><p className="muted">{d}</p></article>)}</div></section>
  <section className="section container"><div className="card"><span className="kicker">Growth loop</span><h2>Research → Create → Optimize → Publish → Measure</h2><p className="muted">Use owned analytics and Search Console data to identify opportunities, create content, distribute it, and continuously improve. The platform does not guarantee rankings or traffic.</p></div></section>
 </main></PublicShell>;
}