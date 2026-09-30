"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }
    if (result.mfaRequired && result.challengeToken) {
      sessionStorage.setItem("gcos_mfa_challenge", result.challengeToken);
      router.push("/mfa");
      return;
    }
    router.push(result.redirectTo ?? "/dashboard");
  }

  return <form onSubmit={submit}>
    <label>Email<input required type="email" name="email" autoComplete="email" /></label>
    <label>Password<input required type="password" name="password" autoComplete="current-password" /></label>
    {error && <p role="alert">{error}</p>}
    <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
  </form>;
}
