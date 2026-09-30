import Link from "next/link";
import LoginForm from "./login-form";

export default function Login() {
  return <main className="section container" style={{ maxWidth: 560 }}>
    <div className="card">
      <h1>Sign in</h1>
      <p className="muted">Secure authentication with email verification and MFA support.</p>
      <LoginForm />
      <p><Link href="/forgot-password">Forgot password?</Link> · <Link href="/register">Create account</Link></p>
    </div>
  </main>;
}
