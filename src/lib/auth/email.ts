function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required email configuration: ${name}`);
  return value;
}

function isE2e() {
  return process.env.NODE_ENV === "test" && process.env.E2E_TEST_MODE === "true";
}

export async function sendVerificationEmail(to: string, token: string) {
  if (isE2e()) return;
  const baseUrl = required("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  const apiKey = required("RESEND_API_KEY");
  const from = required("AUTH_EMAIL_FROM");
  const url = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Verify your Google Creator OS account",
      html: `<p>Verify your account to continue.</p><p><a href="${url}">Verify email address</a></p>`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Email delivery failed");
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (isE2e()) return;
  const baseUrl = required("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  const apiKey = required("RESEND_API_KEY");
  const from = required("AUTH_EMAIL_FROM");
  const url = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Google Creator OS password",
      html: `<p>A password reset was requested for your account.</p><p><a href="${url}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Email delivery failed");
}

export async function sendWorkspaceInvitationEmail(to: string, token: string, workspaceName: string) {
  if (isE2e()) return;
  const baseUrl = required("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  const apiKey = required("RESEND_API_KEY");
  const from = required("AUTH_EMAIL_FROM");
  const url = `${baseUrl}/invite?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Invitation to join ${workspaceName}`,
      html: `<p>You have been invited to join <strong>${workspaceName}</strong> on Google Creator OS.</p><p><a href="${url}">Accept invitation</a></p><p>This invitation expires in 7 days.</p>`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Email delivery failed");
}
