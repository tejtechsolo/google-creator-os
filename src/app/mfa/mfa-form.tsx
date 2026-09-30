"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MfaForm() {
  const router = useRouter();
  const [recovery, setRecovery] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setToken(sessionStorage.getItem("gcos_mfa_challenge")), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError("Your sign-in challenge is missing or expired."); return; }
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/mfa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recovery ? { token, recoveryCode: data.get("code") } : { token, code: data.get("code") }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(result.error ?? "Verification failed."); return; }
    sessionStorage.removeItem("gcos_mfa_challenge");
    router.replace(result.redirectTo ?? "/dashboard");
  }

  return <>
    <form onSubmit={submit}>
      <label>{recovery ? "Recovery code" : "Authenticator code"}
        <input required name="code" inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" maxLength={recovery ? 12 : 6} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify"}</button>
    </form>
    <button type="button" onClick={() => setRecovery(!recovery)}>{recovery ? "Use authenticator app" : "Use recovery code"}</button>
    <p><button type="button" onClick={() => router.push("/login")}>Start over</button></p>
  </>;
}
