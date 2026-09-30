import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Google Creator OS", template: "%s | Google Creator OS" },
  description: "A secure workspace for knowledge, content, SEO, publishing, automation and analytics.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}