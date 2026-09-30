import type { MetadataRoute } from "next";

const routes = ["/", "/about", "/products", "/solutions", "/pricing", "/integrations", "/security", "/resources", "/contact", "/privacy", "/login", "/register", "/forgot-password"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return routes.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
