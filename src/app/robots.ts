import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/dashboard", "/settings", "/checkout/success"],
      },
    ],
    sitemap: "https://mediaplaypromo.com/sitemap.xml",
    host: "https://mediaplaypromo.com",
  };
}
