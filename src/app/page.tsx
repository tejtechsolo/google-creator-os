export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Google Creator OS</h1>
      <p>Google integrations and automation foundation.</p>
      <a href="/api/auth/google?services=gmail,drive,youtube,calendar,sheets">Connect Google</a>
    </main>
  );
}
