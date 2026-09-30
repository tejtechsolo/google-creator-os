import MfaForm from "./mfa-form";

export default function MfaPage() {
  return <main className="section container" style={{ maxWidth: 560 }}>
    <div className="card">
      <h1>Verify your sign-in</h1>
      <p className="muted">Enter the 6-digit code from your authenticator app, or use a recovery code.</p>
      <MfaForm />
    </div>
  </main>;
}
