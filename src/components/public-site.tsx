import Link from "next/link";

export function PublicNav() {
  return <header className="container"><nav className="nav">
    <Link href="/" style={{fontWeight:900,fontSize:20}}>Creator OS</Link>
    <div className="navlinks">
      <Link href="/products">Products</Link><Link href="/solutions">Solutions</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link>
      <Link href="/login">Sign in</Link><Link className="btn btn-primary" href="/register">Get started</Link>
    </div>
  </nav></header>;
}
export function PublicFooter() {
  return <footer className="footer"><div className="container grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))"}}>
    <div><strong>Creator OS</strong><p>Knowledge, content, SEO, publishing, automation and analytics in one workspace.</p></div>
    <div><strong>Product</strong><p><Link href="/products">Products</Link><br/><Link href="/integrations">Integrations</Link><br/><Link href="/pricing">Pricing</Link></p></div>
    <div><strong>Resources</strong><p><Link href="/resources">Resources</Link><br/><Link href="/security">Security</Link><br/><Link href="/changelog">Changelog</Link></p></div>
    <div><strong>Company</strong><p><Link href="/about">About</Link><br/><Link href="/contact">Contact</Link><br/><Link href="/privacy">Privacy</Link></p></div>
  </div></footer>;
}
export function PublicShell({children}:{children:React.ReactNode}) { return <><PublicNav/>{children}<PublicFooter/></>; }