import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { PRODUCTS } from "@/lib/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mediaplaypromo.com";
  const now = new Date();

  const staticPages = [
    "", "/pricing", "/login", "/register",
    "/terms", "/privacy", "/refunds", "/cookies", "/legal",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const categoryPages = CATEGORIES.filter((c) => c.enabled).map((c) => ({
    url: `${base}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productPages = PRODUCTS.filter((p) => p.enabled).map((p) => ({
    url: `${base}/categories/${p.categorySlug}/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
