"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
      }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to create account.");
      return;
    }
    setMessage(result.message ?? "Account created. Check your email to verify your account.");
    event.currentTarget.reset();
    if (result.redirectTo) router.push(result.redirectTo);
  }

  return (
    <form onSubmit={submit}>
      <label>Name<input name="name" autoComplete="name" /></label>
      <label>Email<input required type="email" name="email" autoComplete="email" /></label>
      <label>Password<input required type="password" name="password" autoComplete="new-password" minLength={12} /></label>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
