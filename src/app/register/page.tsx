import Link from "next/link";
import RegisterForm from "./register-form";

export default function Register() {
  return (
    <main className="section container" style={{ maxWidth: 560 }}>
      <div className="card">
        <h1>Create account</h1>
        <p className="muted">Use a long unique password. MFA enrollment will be part of onboarding.</p>
        <RegisterForm />
        <p><Link href="/login">Already have an account?</Link></p>
      </div>
    </main>
  );
}
